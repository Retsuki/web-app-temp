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
		private readonly stripeClient: StripeClient,
	) {}

	async execute(): Promise<GetPlansResponse> {
		const planRepository = this.container.plansRepository;
		const dbPlans = await planRepository.findAll();

		// 1) Stripeから有効なProduct/Priceを取得
		const stripeProducts = await this.stripeClient.api.products.list({
			active: true,
			limit: 100,
		});

		// DB上のプラン行を slug で引けるようにマップ化
		type PlanRow = (typeof dbPlans)[number];
		const planBySlug = new Map<PlanRow["slug"], PlanRow>(
			dbPlans.map((row) => [row.slug as PlanId, row]),
		);

		// paid plans を DTO と並び順キーのペアで保持
		type PlanDto = GetPlansResponse["plans"][number];
		const paidPlanEntries: { dto: PlanDto; sortKey: number }[] = [];
		for (const product of stripeProducts.data) {
			const productMetadata = (product.metadata as StripeProductMetadata) || {};
			const planId = this.getPlanIdFromStripeProduct(
				product.name,
				productMetadata,
			);
			if (!planId) continue; // 想定外Productは除外

			// 公開フラグ（metadata.public）が truthy のもののみ採用
			const isPublic = parseBooleanish(productMetadata.public);
			if (!isPublic) continue;

			// 該当ProductのPrice一覧
			const prices = await this.stripeClient.api.prices.list({
				product: product.id,
				active: true,
				limit: 100,
			});
			const monthlyPrice = prices.data.find(
				(price) => price.recurring?.interval === "month",
			);
			const yearlyPrice = prices.data.find(
				(price) => price.recurring?.interval === "year",
			);

			const planFromDb = planBySlug.get(planId);
			const sortKey = this.getSortOrderFromStripeMetadata(productMetadata);

			paidPlanEntries.push({
				sortKey,
				dto: {
					id: planId,
					name: product.name || planFromDb?.name || planId,
					description: product.description || planFromDb?.description || "",
					monthlyPrice: monthlyPrice?.unit_amount ?? 0,
					yearlyPrice: yearlyPrice?.unit_amount ?? 0,
				},
			});
		}

		// 2) Freeプラン（Stripeには存在しないためDB由来）
		const freePlanFromDb = planBySlug.get(PLANS.free);
		const freePlanEntries: { dto: PlanDto; sortKey: number }[] = freePlanFromDb
			? [
					{
						sortKey: 0, // Free は先頭固定（Starter=1, Pro=2 と整合）
						dto: {
							id: PLANS.free,
							name: freePlanFromDb?.name || "Free",
							description: freePlanFromDb?.description || "",
							monthlyPrice: 0,
							yearlyPrice: 0,
						},
					},
				]
			: [];

		// 3) 並び順: Stripe metadata.sortOrder（未設定は末尾）+ Free は 0
		const sortedPlans = [...freePlanEntries, ...paidPlanEntries]
			.sort((a, b) => a.sortKey - b.sortKey)
			.map((entry) => entry.dto);

		return { plans: sortedPlans };
	}

	// Product からプランIDを解決（metadata.planId を最優先）
	private getPlanIdFromStripeProduct(
		name?: string | null,
		metadata?: Record<string, string> | StripeProductMetadata,
	) {
		const meta = (metadata || {}) as StripeProductMetadata;
		const metaPlan = String(meta.planId || "").toLowerCase();
		if (metaPlan === PLANS.starter) return PLANS.starter;
		if (metaPlan === PLANS.pro) return PLANS.pro;

		const n = String(name || "").toLowerCase();
		if (n === PLANS.starter) return PLANS.starter;
		if (n === PLANS.pro) return PLANS.pro;
		return null;
	}

	// 並び順の解決（未設定は末尾へ）
	private getSortOrderFromStripeMetadata(
		metadata?: Record<string, string> | StripeProductMetadata,
	): number {
		const meta = (metadata || {}) as StripeProductMetadata;
		const rawSortOrder = meta.sortOrder;
		const parsed = Number.parseFloat(String(rawSortOrder ?? ""));
		return Number.isFinite(parsed) ? parsed : 9999;
	}
}
