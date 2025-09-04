import { defineConfig } from 'prisma/config'

export default defineConfig({
  // Seed configuration
  migrations: {
    seed: 'tsx src/seed.ts',
  },
})