import { pgEnum } from "drizzle-orm/pg-core";

/** 計測単位 */
export const METER_UNITS = {
	COUNT: "count",
	TOKEN: "token",
	SECOND: "second",
} as const;

/** count, token, second */
export const meterUnitEnum = pgEnum(
	"meter_unit",
	Object.values(METER_UNITS) as [string, ...string[]],
);

export type MeterUnit = (typeof METER_UNITS)[keyof typeof METER_UNITS];

/** トランザクションタイプ */
export const TRANSACTION_TYPES = {
	ALLOCATION: "allocation",
	CONSUMPTION: "consumption",
	EXPIRY: "expiry",
	REFUND: "refund",
} as const;

/** allocation, consumption, expiry, refund */
export const transactionTypeEnum = pgEnum(
	"transaction_type",
	Object.values(TRANSACTION_TYPES) as [string, ...string[]],
);

export type TransactionType =
	(typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES];

/** キャンペーンタイプ */
export const CAMPAIGN_TYPES = {
	COUPON: "coupon",
	AUTOMATIC: "automatic",
	REFERRAL: "referral",
	FIRST_TIME: "first_time",
} as const;

/** coupon, automatic, referral, first_time */
export const campaignTypeEnum = pgEnum(
	"campaign_type",
	Object.values(CAMPAIGN_TYPES) as [string, ...string[]],
);

export type CampaignType = (typeof CAMPAIGN_TYPES)[keyof typeof CAMPAIGN_TYPES];

/** キャンペーンステータス */
export const CAMPAIGN_STATUS = {
	DRAFT: "draft",
	ACTIVE: "active",
	PAUSED: "paused",
	ENDED: "ended",
} as const;

/** draft, active, paused, ended */
export const campaignStatusEnum = pgEnum(
	"campaign_status",
	Object.values(CAMPAIGN_STATUS) as [string, ...string[]],
);

export type CampaignStatus =
	(typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

/** サブスクリプションステータス */
export const OM_SUBSCRIPTION_STATUSES = {
	TRIALING: "trialing",
	ACTIVE: "active",
	CANCELED: "canceled",
	PAST_DUE: "past_due",
	UNPAID: "unpaid",
	INCOMPLETE: "incomplete",
	INCOMPLETE_EXPIRED: "incomplete_expired",
} as const;

/** trialing, active, canceled, past_due, unpaid, incomplete, incomplete_expired */
export const omSubscriptionStatusEnum = pgEnum(
	"om_subscription_status",
	Object.values(OM_SUBSCRIPTION_STATUSES) as [string, ...string[]],
);

export type OmSubscriptionStatus =
	(typeof OM_SUBSCRIPTION_STATUSES)[keyof typeof OM_SUBSCRIPTION_STATUSES];
