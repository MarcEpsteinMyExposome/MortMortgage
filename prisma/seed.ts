import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const FIXTURES_DIR = path.resolve(process.cwd(), 'src', 'fixtures')

async function main() {
  console.log('Seeding demo data...')

  await prisma.user.upsert({
    where: { email: 'admin@demo.local' },
    update: {},
    create: {
      email: 'admin@demo.local',
      name: 'Demo Admin',
      role: 'ADMIN'
    }
  })

  // Upsert supervisor and caseworker users
  const demoUsers = [
    { id: 'demo-supervisor-1', email: 'supervisor@demo.com', name: 'Maria Rodriguez', role: 'SUPERVISOR' },
    { id: 'demo-caseworker-1', email: 'caseworker1@demo.com', name: 'Sarah Chen', role: 'CASEWORKER' },
    { id: 'demo-caseworker-2', email: 'caseworker2@demo.com', name: 'James Wilson', role: 'CASEWORKER' },
    { id: 'demo-caseworker-3', email: 'caseworker3@demo.com', name: 'Priya Patel', role: 'CASEWORKER' },
    { id: 'demo-caseworker-4', email: 'caseworker4@demo.com', name: 'Marcus Johnson', role: 'CASEWORKER' }
  ]

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role },
      create: { id: user.id, email: user.email, name: user.name, role: user.role }
    })
    console.log(`Upserted user: ${user.name} (${user.role})`)
  }

  const seedFixtures = process.env.SEED_FIXTURES !== 'false'

  if (seedFixtures) {
    const files = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.json'))
    for (const f of files) {
      const raw = fs.readFileSync(path.join(FIXTURES_DIR, f), 'utf-8')
      const fixture = JSON.parse(raw)
      const existing = await prisma.application.findUnique({ where: { id: fixture.id } }).catch(() => null)
      if (existing) {
        console.log(`Skipping existing application ${fixture.id}`)
        continue
      }

      await prisma.application.create({
        data: {
          id: fixture.id,
          status: 'submitted',
          data: JSON.stringify(fixture),
          borrowers: JSON.stringify(fixture.borrowers ?? [])
        }
      })

      console.log(`Seeded application ${fixture.id}`)
    }
  } else {
    console.log('Skipping fixture seeding (SEED_FIXTURES=false)')
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
