import {
	type PlanId,
	parseBooleanish,
	type StripeClient,
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
		metadata?: Record<string, string>,
	) {
		const n = (name || "").toLowerCase();
		const m = Object.fromEntries(
			Object.entries(metadata || {}).map(([k, v]) => [
				String(k).toLowerCase(),
				String(v ?? "").toLowerCase(),
			]),
		);
		const metaPlan = m.planid;
		if (metaPlan === "starter") return "starter";
		if (metaPlan === "pro") return "pro";
		if (n === "starter") return "starter";
		if (n === "pro") return "pro";
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
		const plansBySlug = new Map<DbPlan["plan"], DbPlan>(
			dbPlans.map((p) => [p.plan as PlanId, p]),
		);

		const paidPlanDtos: GetPlansResponse["plans"] = [];
		for (const product of stripeProducts.data) {
			const planId = this.resolvePlanId(product.name, product.metadata);
			if (!planId) continue;

			const isPublic = parseBooleanish(product.metadata?.public);
			if (!isPublic) continue;

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
				id: planId as PlanId,
				name: product.name || (dbPlan ? planId : planId),
				description: product.description || "",
				monthlyPrice: monthly?.unit_amount ?? 0,
				yearlyPrice: yearly?.unit_amount ?? 0,
			});
		}

		// Freeプラン（Stripe上にはない）
		const freeDb = plansBySlug.get("free");
		const free: GetPlansResponse["plans"] = freeDb
			? [
					{
						id: "free",
						name: "Free",
						description: "個人の趣味プロジェクトに最適",
						monthlyPrice: 0,
						yearlyPrice: 0,
					},
				]
			: [
					{
						id: "free",
						name: "Free",
						description: "個人の趣味プロジェクトに最適",
						monthlyPrice: 0,
						yearlyPrice: 0,
					},
				];

		// 並び順: Free -> Starter -> Pro
		const order: Record<PlanId, number> = { free: 0, starter: 1, pro: 2 };
		const plans = [...free, ...paidPlanDtos].sort(
			(a, b) => order[a.id as PlanId] - order[b.id as PlanId],
		);

		return { plans };
	}
}
