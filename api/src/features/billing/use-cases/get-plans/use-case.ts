import {
	PLANS,
	type PlanId,
	parseBooleanish,
	type StripeClient,
	type StripeProductMetadata,
} from "../../../../external-apis/stripe/stripe-client.js";
import type { BillingContainer } from "../../container.js";
import type { GetPlansResponse } from "./dto.js";

export class GetPlansUseCase {
	constructor(
		private readonly container: BillingContainer,
		private readonly stripe: StripeClient,
	) {}

	private resolvePlanId(
		name?: string | null,
		metadata?: Record<string, string> | StripeProductMetadata,
	) {
		const n = (name || "").toLowerCase();
		const m = Object.fromEntries(
			Object.entries(metadata || {}).map(([k, v]) => [
				String(k).toLowerCase(),
				String(v ?? "").toLowerCase(),
			]),
		);
		const metaPlan = m.planid;
		if (metaPlan === PLANS.starter) return PLANS.starter;
		if (metaPlan === PLANS.pro) return PLANS.pro;
		if (n === PLANS.starter) return PLANS.starter;
		if (n === PLANS.pro) return PLANS.pro;
		return null;
	}

	async execute(): Promise<GetPlansResponse> {
		const plansRepository = this.container.plansRepository;
		const dbPlans = await plansRepository.findAll();

		// Stripeの有効Product/Priceを取得
		const stripeProducts = await this.stripe.api.products.list({
			active: true,
			limit: 100,
		});

		// DB plans(plan_limits)を plan スラッグで引けるように
		type DbPlan = (typeof dbPlans)[number];
		const plansBySlug = new Map<DbPlan["slug"], DbPlan>(
			dbPlans.map((p) => [p.slug as PlanId, p]),
		);

		const paidPlanDtos = [] as GetPlansResponse["plans"];
		for (const product of stripeProducts.data) {
			const stripeMeta =
				(product.metadata as unknown as StripeProductMetadata) || {};
			const planId = this.resolvePlanId(product.name, stripeMeta);
			if (!planId) continue; // 想定外Productは除外

			// 公開フラグ（metadata.public）が truthy のもののみ採用
			const isPublic = parseBooleanish(stripeMeta.public);
			if (!isPublic) continue;

			// 該当ProductのPrice一覧
			const prices = await this.stripe.api.prices.list({
				product: product.id,
				active: true,
				limit: 100,
			});
			const monthly = prices.data.find(
				(x) => x.recurring?.interval === "month",
			);
			const yearly = prices.data.find((x) => x.recurring?.interval === "year");

			const dbPlan = plansBySlug.get(planId);
			paidPlanDtos.push({
				id: planId,
				name: product.name || dbPlan?.name || planId,
				description: product.description || dbPlan?.description || "",
				monthlyPrice: monthly?.unit_amount ?? 0,
				yearlyPrice: yearly?.unit_amount ?? 0,
			});
		}

		// 2) Freeプラン（Stripeには存在しないためDB由来）
		const freeDbPlan = plansBySlug.get(PLANS.free);
		const freePlanDtos = freeDbPlan
			? [
					{
						id: PLANS.free,
						name: freeDbPlan?.name || "Free",
						description: freeDbPlan?.description || "",
						monthlyPrice: 0,
						yearlyPrice: 0,
					},
				]
			: [];

		// 3) 並び順: Free -> Starter -> Pro（存在するもののみ）
		const planOrder: Record<PlanId, number> = {
			[PLANS.free]: 0,
			[PLANS.starter]: 1,
			[PLANS.pro]: 2,
		};
		const mergedPlans = [...freePlanDtos, ...paidPlanDtos].sort(
			(a, b) => planOrder[a.id as PlanId] - planOrder[b.id as PlanId],
		);

		return { plans: mergedPlans };
	}
}
