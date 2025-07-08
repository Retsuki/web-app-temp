import { reset } from 'drizzle-seed'
import { db, profiles } from '../../index.js'

export const seed = async () => {
  // データベースをリセット
  await reset(db, {
    profiles,
  })

  console.log('Database reset completed.')
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
