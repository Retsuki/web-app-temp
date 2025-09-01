import 'dotenv/config'
import { getDb } from '../../db/database.js'
import { samplePlanLimits } from '../apps/sample/index.js'

async function main() {
  const db = getDb()

  const rows = [
    {
      plan: 'free' as const,
      monthlyUsageLimit: 1000,
      projectsLimit: 1,
      membersPerProjectLimit: 1,
      features: { storage: 1, support: 'community' },
      monthlyPrice: 0,
      yearlyPrice: 0,
      displayOrder: 1,
    },
    {
      plan: 'indie' as const,
      monthlyUsageLimit: 10000,
      projectsLimit: 5,
      membersPerProjectLimit: 3,
      features: { storage: 10, support: 'email' },
      monthlyPrice: 1000,
      yearlyPrice: 10000,
      displayOrder: 2,
    },
    {
      plan: 'pro' as const,
      monthlyUsageLimit: 100000,
      projectsLimit: 999999,
      membersPerProjectLimit: 10,
      features: { storage: 100, support: 'priority' },
      monthlyPrice: 3000,
      yearlyPrice: 30000,
      displayOrder: 3,
    },
  ]

  for (const row of rows) {
    await db
      .insert(samplePlanLimits)
      .values(row as any)
      .onConflictDoNothing()
  }

  // eslint-disable-next-line no-console
  console.log('Seeded sample_plan_limits')
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

