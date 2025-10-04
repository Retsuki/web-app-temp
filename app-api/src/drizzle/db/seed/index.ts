import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { reset } from 'drizzle-seed'
import { sql, eq } from 'drizzle-orm'
import { AppConfig } from '../../../_shared/constants/config.js'
import { getDb } from '../database.js'
import * as schema from '../schema.js'

export const seed = async () => {
  const db = getDb()

  // 開発用: DB全体をリセット（本番は避ける）
  await reset(db, schema)
  console.log('Database reset completed.')

  // Plans の初期データ
  console.log('Seeding plans...')
  const plans = [
    {
      slug: 'free',
      name: 'Free',
      description: 'はじめての方向け',
      metadata: { version: 'v1', features: { basic: true } },
      isActive: true,
      displayOrder: 0,
    },
    {
      slug: 'starter',
      name: 'Starter',
      description: '主要機能をしっかり',
      metadata: { version: 'v1', features: { advanced: false } },
      isActive: true,
      displayOrder: 1,
    },
    {
      slug: 'pro',
      name: 'Pro',
      description: 'よりリッチな体験',
      metadata: { version: 'v1', features: { advanced: true } },
      isActive: true,
      displayOrder: 2,
    },
  ] satisfies Array<Omit<typeof schema.plans.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>>

  await db
    .insert(schema.plans)
    .values(plans)
    .onConflictDoUpdate({
      target: schema.plans.slug,
      set: {
        name: sql`EXCLUDED.name`,
        description: sql`EXCLUDED.description`,
        metadata: sql`EXCLUDED.metadata`,
        isActive: sql`EXCLUDED.is_active`,
        displayOrder: sql`EXCLUDED.display_order`,
        updatedAt: sql`now()`,
      },
    })
  console.log('Plans seeding completed.')

  // Supabase Auth: テストユーザーを作成（本番ではスキップ）
  if (process.env.NODE_ENV === 'production') {
    console.warn('Skip creating Supabase user in production environment.')
    return
  }

  if (!AppConfig.hasSupabaseConfig()) {
    console.warn('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定のため、Authユーザー作成をスキップします。')
  } else {
    const supabaseAdmin = createClient(AppConfig.SUPABASE_URL!, AppConfig.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const email = 'dev@example.com'
    const password = 'password1234'
    console.log('Creating a default Supabase Auth user...', email)
    const { data: createdUser, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nickname: 'デモユーザー' },
    })
    if (error) {
      console.warn('Failed to create test user:', error.message)
    } else {
      const userId = createdUser.user?.id
      if (userId) {
        console.log('Seeding profile/userSettings/billingCustomers for test user...')
        await db.insert(schema.profiles).values({ userId, email, nickname: 'デモユーザー' })

        // user_settings（言語のみ）
        await db.insert(schema.userSettings).values({ userId, language: 'ja' as any })

        // billing_customers（freeに紐付け）
        const [freePlan] = await db.select().from(schema.plans).where(eq(schema.plans.slug, 'free')).limit(1)
        if (freePlan?.id) {
          await db
            .insert(schema.billingCustomers)
            .values({ userId, stripeCustomerId: 'cus_dev_seed', planId: freePlan.id })
        }
      }
    }
  }
}

seed()
  .then(() => {
    console.log('Seeding completed.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Error during seeding:', err)
    process.exit(1)
  })
