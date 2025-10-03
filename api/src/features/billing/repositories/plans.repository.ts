import type { Database } from "../../../drizzle/index.js";
import { eq, plans } from "../../../drizzle/index.js";
import type { PlanId } from "../../../external-apis/stripe/stripe-client.js";

export class PlansRepository {
	constructor(private db: Database) {}

	async getIdBySlug(slug: PlanId): Promise<string | null> {
		const [row] = await this.db
			.select({ id: plans.id })
			.from(plans)
			.where(eq(plans.slug, slug))
			.limit(1);
		return row?.id ?? null;
	}

	async getSlugById(id: string): Promise<PlanId | null> {
		const [row] = await this.db
			.select({ slug: plans.slug })
			.from(plans)
			.where(eq(plans.id, id))
			.limit(1);
		return (row?.slug as PlanId | undefined) ?? null;
	}

	async findAll() {
		return this.db.select().from(plans).orderBy(plans.displayOrder);
	}

	async findByPlan(plan: PlanId) {
		const [row] = await this.db
			.select()
			.from(plans)
			.where(eq(plans.slug, plan))
			.limit(1);
		return row ?? null;
	}
}
