import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: {
      target: './openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: './src/lib/api/generated',
      schemas: './src/lib/api/generated/schemas',
      client: 'react-query',
      mock: true,
      override: {
        mutator: {
          path: './src/lib/api/orval-client.ts',
          name: 'orvalClient',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
          options: {
            staleTime: 60 * 1000,
          },
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'npx biome check --write',
    },
  },
})
