import { relations } from "drizzle-orm";
import { profiles } from "./shared/common-schema.js";
import { omPaymentHistory, omProjects, omSubscriptions } from './apps/om/schema.js'
import { pmtPaymentHistory, pmtProjects, pmtSubscriptions } from './apps/pmt/schema.js'

// Apps
export * from "./apps/sample/index.js";
export * from "./apps/pmt/index.js";
export * from "./apps/om/index.js";

// Shared
export * from "./shared/common-schema.js";

// Relations (循環参照回避のためここで定義)
export const profilesRelations = relations(profiles, ({ many }) => ({
  // PMT relations
  pmtProjects: many(pmtProjects),
  pmtSubscriptions: many(pmtSubscriptions),
  pmtPaymentHistory: many(pmtPaymentHistory),
  // OM relations
  omProjects: many(omProjects),
  omSubscriptions: many(omSubscriptions),
  omPaymentHistory: many(omPaymentHistory),
}))
