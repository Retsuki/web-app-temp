import Stripe from "stripe";
import { AppConfig } from "../../_shared/constants/config.js";

export const PLANS = {
	free: "free",
	starter: "starter",
	pro: "pro",
} as const;
export type PlanId = keyof typeof PLANS;

export const BILLING_CYCLES = {
	monthly: "monthly",
	yearly: "yearly",
} as const;
export type BillingCycle = keyof typeof BILLING_CYCLES;
export type AppEnvType = "dev" | "prod";
export type Booleanish = boolean | "true" | "false";

export type StripeProductMetadata = {
	planId?: Exclude<PlanId, "free">;
	public?: Booleanish;
	sortOrder?: number | string;
	env?: AppEnvType;
};

export type StripePriceMetadata = {
	planId?: Exclude<PlanId, "free">;
	billingCycle?: BillingCycle;
	version?: string;
	current?: Booleanish;
	env?: AppEnvType;
};

export function parseBooleanish(value: unknown): boolean {
	if (typeof value === "boolean") return value;
	const v = String(value ?? "")
		.trim()
		.toLowerCase();
	return v === "true";
}

export class StripeClient {
	private readonly _api: Stripe;

	constructor(secretKey?: string) {
		const key = secretKey || AppConfig.STRIPE_SECRET_KEY;
		if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
		this._api = new Stripe(key, {
			apiVersion: "2025-08-27.basil",
			typescript: true,
		});
	}

	get api(): Stripe {
		return this._api;
	}

	constructEvent(body: string | Buffer, signature: string) {
		const secret = AppConfig.STRIPE_WEBHOOK_SECRET || "";
		return this._api.webhooks.constructEvent(body, signature, secret);
	}
}

let singletonClient: StripeClient | null = null;
export function getStripeClient(): StripeClient {
	if (!singletonClient) singletonClient = new StripeClient();
	return singletonClient;
}
