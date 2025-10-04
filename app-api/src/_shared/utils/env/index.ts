import type { DecodedIdToken } from 'firebase-admin/auth'

export type AppHonoEnv = {
  Variables: {
    user?: DecodedIdToken
  }
}
