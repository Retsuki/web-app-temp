import { relations } from 'drizzle-orm'
import { omPaymentHistory, omProjects, omSubscriptions } from './apps/om/index.js'
import { pmtProjects } from './apps/pmt/index.js'
import { profiles } from './shared/common-schema.js'

export * from './apps/om/index.js'
export * from './apps/pmt/index.js'
export * from './apps/sample/index.js'
export * from './shared/common-schema.js'

// Relations (必要最小限: 参照整合があるもののみ)
export const profilesRelations = relations(profiles, ({ many }) => ({
  // PMT
  pmtProjects: many(pmtProjects),
  // OM
  omProjects: many(omProjects),
  omSubscriptions: many(omSubscriptions),
  omPaymentHistory: many(omPaymentHistory),
}))
