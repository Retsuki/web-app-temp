import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { reset } from 'drizzle-seed'
import { logger } from '../../../_shared/utils/logger.js'
import { getDb, pmtFormats, pmtPlanLimits } from '../../index.js'
import * as schema from '../schema.js'

// .envファイルから環境変数を読み込む
dotenv.config()

// Supabase Admin Clientの初期化
const initSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    logger.warn('Supabase環境変数が設定されていません。Authデータのリセットをスキップします。')
    return null
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Supabase Authデータのリセット
const resetAuthData = async () => {
  const supabase = initSupabaseAdmin()
  if (!supabase) {
    return
  }

  try {
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers()

    if (listError) {
      logger.error({ error: listError }, 'ユーザーリストの取得に失敗しました')
      return
    }

    if (!users || users.length === 0) {
      return
    }

    for (const user of users) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
      if (deleteError) {
        logger.error({ error: deleteError, email: user.email }, 'ユーザーの削除に失敗しました')
      }
    }
  } catch (error) {
    logger.error({ error }, 'Authデータのリセット中にエラーが発生しました')
  }
}

// DBテーブルのリセット（drizzle-seedのreset関数を使用）
const resetDatabaseTables = async () => {
  try {
    const db = getDb()
    await reset(db, schema)
  } catch (error) {
    logger.error({ error }, 'データベーステーブルのリセット中にエラーが発生しました')
    throw error
  }
}

export const seed = async () => {
  logger.info('シード処理を開始...')

  await resetAuthData()
  await resetDatabaseTables()

  // formatsテーブルに初期データを挿入
  const formatsData = [
    {
      id: '5f7033c2-f1fc-40d1-8ab2-e9d00b5700e6',
      name: 'IMAGE',
      description: '画像',
      imageUrl: null,
      type: 'system',
      grade: 'basic',
    },
    {
      id: '67035c2e-1178-45ed-9efd-221807fa0176',
      name: 'SINGLE AVATAR',
      description: 'アバターが語る',
      imageUrl: null,
      type: 'system',
      grade: 'basic',
    },
    {
      id: '8e38d347-b420-419e-8c43-d4afaf5f3ac4',
      name: 'TEXT',
      description: '初回オンボーディングで使用する',
      imageUrl: null,
      type: 'system',
      grade: 'basic',
    },
  ]

  const db = getDb()

  await db.insert(pmtFormats).values(formatsData)

  // plan_limitsテーブルに初期データを挿入
  const planLimitsData = [
    {
      plan: 'free',
      monthlyCredits: 0,
      projectsLimit: 1,
      policiesPerProjectLimit: 5,
      snsAccountsLimit: 1,
      monthlyPrice: '0',
      yearlyPrice: '0',
      displayOrder: 1,
      features: {
        api_access: false,
        export: false,
        priority_support: false,
        custom_branding: false,
      },
    },
    {
      plan: 'standard',
      monthlyCredits: 3000,
      projectsLimit: 10,
      policiesPerProjectLimit: 10,
      snsAccountsLimit: 5,
      monthlyPrice: '19.99',
      yearlyPrice: '199.99',
      displayOrder: 2,
      features: {
        api_access: true,
        export: true,
        priority_support: false,
        custom_branding: false,
      },
    },
    {
      plan: 'pro',
      monthlyCredits: 8000,
      projectsLimit: 30,
      policiesPerProjectLimit: 30,
      snsAccountsLimit: 20,
      monthlyPrice: '39.99',
      yearlyPrice: '399.99',
      displayOrder: 3,
      features: {
        api_access: true,
        export: true,
        priority_support: true,
        custom_branding: true,
      },
    },
  ]

  await db.insert(pmtPlanLimits).values(planLimitsData)

  logger.info('シード処理が完了しました')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ error: err }, 'シード処理中にエラーが発生しました')
    process.exit(1)
  })
