import { prisma } from '../../../lib/prisma'
import { withAuth, isRole } from '../../../lib/auth'
import {
  randomChoice, fakeBorrower, fakeLoan, fakeProperty, fakeAssets, fakeLiabilities,
  fakeRealEstateOwned, fakeDeclarations, fakeDemographics, fakeAddress, fakeCurrentAddress,
  fakeEmployment, fakePastDate, fakeInterestRate
} from '../../../lib/fake-data'

// Vercel serverless timeout
export const maxDuration = 60

// --- Demo users ---

const CASEWORKERS = [
  { id: 'demo-caseworker-1', email: 'caseworker1@demo.com', name: 'Sarah Chen', role: 'CASEWORKER' },
  { id: 'demo-caseworker-2', email: 'caseworker2@demo.com', name: 'James Wilson', role: 'CASEWORKER' },
  { id: 'demo-caseworker-3', email: 'caseworker3@demo.com', name: 'Priya Patel', role: 'CASEWORKER' },
  { id: 'demo-caseworker-4', email: 'caseworker4@demo.com', name: 'Marcus Johnson', role: 'CASEWORKER' }
]

const SUPERVISOR = { id: 'demo-supervisor-1', email: 'supervisor@demo.com', name: 'Maria Rodriguez', role: 'SUPERVISOR' }

// --- Realistic name pools (replaces generic FirstName_42 from fake-data) ---

const FIRST_NAMES = ['Michael', 'Jennifer', 'Robert', 'Patricia', 'David', 'Linda', 'William', 'Barbara', 'Richard', 'Susan',
  'Charles', 'Jessica', 'Joseph', 'Sarah', 'Thomas', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa',
  'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra', 'Steven', 'Ashley', 'Paul', 'Dorothy',
  'Andrew', 'Kimberly', 'Joshua', 'Emily', 'Kenneth', 'Donna', 'Kevin', 'Michelle', 'Brian', 'Carol']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores']
const SUFFIXES = ['', '', '', '', '', '', '', '', '', '', 'Jr', 'Sr', 'II', 'III'] // ~30% chance

const ADDITIONAL_INCOME_TYPES = ['rental_income', 'alimony', 'investment_income', 'pension', 'social_security', 'disability']

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randBetween(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }
function randId(): string { return `seed-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` }
function daysAgo(n: number): Date { return new Date(Date.now() - n * 86400000) }

interface AppConfig {
  status: string
  assignedToId: string | null
  priority: string
  slaOverdue?: boolean
  slaAtRisk?: boolean
  loanAmount?: number
  propertyValue?: number
  monthlyIncome?: number
  monthlyDebt?: number
  createdDaysAgo?: number
  updatedDaysAgo?: number
}

// Build a single realistic borrower using fake-data helpers + real names
function buildSeedBorrower(isPrimary: boolean, overrides?: { monthlyIncome?: number; lastName?: string }) {
  const base = fakeBorrower(isPrimary)
  const firstName = pick(FIRST_NAMES)
  const lastName = overrides?.lastName || pick(LAST_NAMES)
  const suffix = pick(SUFFIXES)
  const monthlyIncome = overrides?.monthlyIncome || base.employment[0].monthlyIncome

  // Override name with realistic names
  base.name = { firstName, lastName, middleName: randBetween(1, 2) === 1 ? pick(FIRST_NAMES) : '', suffix }
  base.contact.email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`
  base.employment[0].monthlyIncome = monthlyIncome

  // Previous address when current duration < 2 years (~40%)
  if (base.currentAddress.durationYears < 2 && base.formerAddresses.length === 0) {
    base.formerAddresses = [{
      ...fakeCurrentAddress(),
      durationYears: randBetween(2, 8),
      durationMonths: randBetween(0, 11)
    }]
  }

  // Previous employment when current job started recently (~30%)
  const startYear = parseInt(base.employment[0].startDate.slice(0, 4))
  if (startYear >= 2024 && randBetween(1, 3) <= 2) {
    const prevJob = fakeEmployment()
    prevJob.startDate = fakePastDate(10)
    ;(prevJob as any).endDate = `${startYear - 1}-${String(randBetween(1, 12)).padStart(2, '0')}-01`
    ;(prevJob as any).current = false
    base.employment.push(prevJob as any)
  }

  // Additional income (~20%)
  if (randBetween(1, 5) === 1) {
    ;(base as any).additionalIncome = [{
      type: pick(ADDITIONAL_INCOME_TYPES),
      amount: randBetween(500, 3000)
    }]
  }

  return base
}

function generateApplication(config: AppConfig) {
  const loanAmount = config.loanAmount || randBetween(150, 750) * 1000
  const propertyValue = config.propertyValue || Math.round(loanAmount / (0.6 + Math.random() * 0.35))
  const monthlyIncome = config.monthlyIncome || randBetween(5000, 15000)
  const createdAt = daysAgo(config.createdDaysAgo || randBetween(5, 60))
  const updatedAt = config.updatedDaysAgo !== undefined ? daysAgo(config.updatedDaysAgo) : createdAt

  let slaDeadline: Date | null = null
  if (config.slaOverdue) {
    slaDeadline = daysAgo(randBetween(1, 5))
  } else if (config.slaAtRisk) {
    slaDeadline = new Date(Date.now() + randBetween(2, 20) * 3600000)
  } else if (config.assignedToId && !['approved', 'denied'].includes(config.status)) {
    slaDeadline = new Date(Date.now() + randBetween(2, 10) * 86400000)
  }

  // Build primary borrower
  const primaryBorrower = buildSeedBorrower(true, { monthlyIncome })

  // Correlate VA loan type with military service
  const militaryStatus = primaryBorrower.militaryService.status
  const isVeteran = militaryStatus !== 'never_served'
  const loanType = isVeteran && randBetween(1, 3) === 1
    ? 'VA'
    : randomChoice(['Conventional', 'Conventional', 'Conventional', 'FHA'] as const)

  // Build loan data
  const loanPurpose = Math.random() > 0.3 ? 'purchase' : 'refinance'
  const data: any = {
    loan: {
      loanAmount,
      loanType,
      loanPurpose,
      loanTermMonths: Math.random() > 0.3 ? 360 : 180,
      interestRate: fakeInterestRate(),
      interestRateType: randBetween(1, 6) === 1 ? 'adjustable' : 'fixed',
      downPayment: {
        amount: propertyValue - loanAmount,
        source: randBetween(1, 7) === 1 ? 'gift' : 'savings'
      }
    },
    property: {
      ...fakeProperty(),
      propertyValue,
      occupancy: 'primary_residence',
    },
    assets: { assets: fakeAssets(randBetween(2, 4)) },
    liabilities: { liabilities: fakeLiabilities(randBetween(1, 4)) },
    realEstate: fakeRealEstateOwned(loanPurpose === 'refinance' ? randBetween(1, 2) : randBetween(0, 1)),
    declarations: { declarations: fakeDeclarations() },
    demographics: fakeDemographics()
  }

  // Gift funds for ~15% of purchase loans
  if (loanPurpose === 'purchase' && data.loan.downPayment.source === 'gift') {
    data.giftFunds = [{
      donorName: `${pick(FIRST_NAMES)} ${primaryBorrower.name.lastName}`,
      donorRelationship: randomChoice(['parent', 'grandparent', 'sibling', 'spouse'] as const),
      amount: randBetween(10000, Math.min(80000, propertyValue - loanAmount)),
      deposited: randBetween(1, 2) === 1
    }]
  }

  // Build borrowers array: primary + optional co-borrower (25%)
  const borrowers: any[] = [primaryBorrower]
  if (randBetween(1, 4) === 1) {
    // Co-borrower: 60% same last name (spouse), 40% different
    const sameLastName = randBetween(1, 5) <= 3
    const coBorrower = buildSeedBorrower(false, {
      lastName: sameLastName ? primaryBorrower.name.lastName : undefined
    })
    // Co-borrower shares current address
    coBorrower.currentAddress = { ...primaryBorrower.currentAddress }
    if (sameLastName) {
      coBorrower.maritalStatus = 'married'
      ;(primaryBorrower as any).maritalStatus = 'married'
    }
    borrowers.push(coBorrower)
  }

  return {
    id: randId(),
    status: config.status,
    data: JSON.stringify(data),
    borrowers: JSON.stringify(borrowers),
    assignedToId: config.assignedToId,
    assignedAt: config.assignedToId ? new Date(createdAt.getTime() + randBetween(1, 3) * 86400000) : null,
    priority: config.priority,
    slaDeadline,
    createdAt,
    updatedAt
  }
}

function buildApplications() {
  const apps: any[] = []

  // Sarah Chen: 7 active + 6 completed (~83% approval)
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[0].id, priority: 'urgent', slaOverdue: true, loanAmount: 520000, createdDaysAgo: 25 }))
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[0].id, priority: 'high', slaAtRisk: true, loanAmount: 380000, createdDaysAgo: 18 }))
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[0].id, priority: 'normal', loanAmount: 290000, createdDaysAgo: 12 }))
  apps.push(generateApplication({ status: 'pending_documents', assignedToId: CASEWORKERS[0].id, priority: 'high', loanAmount: 450000, createdDaysAgo: 20 }))
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[0].id, priority: 'normal', loanAmount: 310000, createdDaysAgo: 8 }))
  apps.push(generateApplication({ status: 'submitted', assignedToId: CASEWORKERS[0].id, priority: 'normal', loanAmount: 275000, createdDaysAgo: 5 }))
  apps.push(generateApplication({ status: 'pending_documents', assignedToId: CASEWORKERS[0].id, priority: 'low', loanAmount: 195000, createdDaysAgo: 3 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[0].id, priority: 'normal', loanAmount: 340000, createdDaysAgo: 45, updatedDaysAgo: 30 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[0].id, priority: 'high', loanAmount: 420000, createdDaysAgo: 50, updatedDaysAgo: 35 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[0].id, priority: 'normal', loanAmount: 265000, createdDaysAgo: 55, updatedDaysAgo: 40 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[0].id, priority: 'normal', loanAmount: 510000, createdDaysAgo: 40, updatedDaysAgo: 25 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[0].id, priority: 'normal', loanAmount: 350000, createdDaysAgo: 35, updatedDaysAgo: 20 }))
  apps.push(generateApplication({ status: 'denied', assignedToId: CASEWORKERS[0].id, priority: 'normal', loanAmount: 680000, propertyValue: 700000, monthlyIncome: 6000, monthlyDebt: 3200, createdDaysAgo: 42, updatedDaysAgo: 28 }))

  // James Wilson: 5 active + 4 completed (75% approval)
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[1].id, priority: 'high', slaOverdue: true, loanAmount: 410000, createdDaysAgo: 22 }))
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[1].id, priority: 'normal', loanAmount: 325000, createdDaysAgo: 15 }))
  apps.push(generateApplication({ status: 'pending_documents', assignedToId: CASEWORKERS[1].id, priority: 'normal', loanAmount: 280000, createdDaysAgo: 10 }))
  apps.push(generateApplication({ status: 'submitted', assignedToId: CASEWORKERS[1].id, priority: 'normal', loanAmount: 350000, createdDaysAgo: 6 }))
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[1].id, priority: 'low', loanAmount: 200000, createdDaysAgo: 4 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[1].id, priority: 'normal', loanAmount: 300000, createdDaysAgo: 48, updatedDaysAgo: 33 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[1].id, priority: 'normal', loanAmount: 380000, createdDaysAgo: 52, updatedDaysAgo: 38 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[1].id, priority: 'normal', loanAmount: 275000, createdDaysAgo: 44, updatedDaysAgo: 30 }))
  apps.push(generateApplication({ status: 'denied', assignedToId: CASEWORKERS[1].id, priority: 'normal', loanAmount: 600000, propertyValue: 620000, monthlyIncome: 5500, monthlyDebt: 2800, createdDaysAgo: 46, updatedDaysAgo: 32 }))

  // Priya Patel: 4 active + 5 completed (60% approval)
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[2].id, priority: 'normal', slaAtRisk: true, loanAmount: 360000, createdDaysAgo: 14 }))
  apps.push(generateApplication({ status: 'submitted', assignedToId: CASEWORKERS[2].id, priority: 'high', loanAmount: 290000, createdDaysAgo: 7 }))
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[2].id, priority: 'normal', loanAmount: 400000, createdDaysAgo: 11 }))
  apps.push(generateApplication({ status: 'pending_documents', assignedToId: CASEWORKERS[2].id, priority: 'normal', loanAmount: 225000, createdDaysAgo: 9 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[2].id, priority: 'normal', loanAmount: 320000, createdDaysAgo: 38, updatedDaysAgo: 26 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[2].id, priority: 'normal', loanAmount: 250000, createdDaysAgo: 42, updatedDaysAgo: 30 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[2].id, priority: 'normal', loanAmount: 380000, createdDaysAgo: 50, updatedDaysAgo: 36 }))
  apps.push(generateApplication({ status: 'denied', assignedToId: CASEWORKERS[2].id, priority: 'normal', loanAmount: 550000, propertyValue: 560000, monthlyIncome: 5000, monthlyDebt: 2500, createdDaysAgo: 47, updatedDaysAgo: 35 }))
  apps.push(generateApplication({ status: 'denied', assignedToId: CASEWORKERS[2].id, priority: 'normal', loanAmount: 480000, propertyValue: 500000, monthlyIncome: 5200, monthlyDebt: 3000, createdDaysAgo: 44, updatedDaysAgo: 31 }))

  // Marcus Johnson: 3 active + 3 completed (67% approval)
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[3].id, priority: 'normal', loanAmount: 240000, createdDaysAgo: 10 }))
  apps.push(generateApplication({ status: 'submitted', assignedToId: CASEWORKERS[3].id, priority: 'normal', loanAmount: 310000, createdDaysAgo: 5 }))
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[3].id, priority: 'high', slaAtRisk: true, loanAmount: 400000, createdDaysAgo: 16 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[3].id, priority: 'normal', loanAmount: 280000, createdDaysAgo: 30, updatedDaysAgo: 18 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[3].id, priority: 'normal', loanAmount: 350000, createdDaysAgo: 35, updatedDaysAgo: 22 }))
  apps.push(generateApplication({ status: 'denied', assignedToId: CASEWORKERS[3].id, priority: 'normal', loanAmount: 700000, propertyValue: 720000, monthlyIncome: 6500, monthlyDebt: 3500, createdDaysAgo: 32, updatedDaysAgo: 20 }))

  // Unassigned submitted apps (6)
  for (let i = 0; i < 6; i++) {
    apps.push(generateApplication({
      status: 'submitted',
      assignedToId: null,
      priority: i === 0 ? 'urgent' : i < 3 ? 'high' : 'normal',
      loanAmount: randBetween(180, 550) * 1000,
      createdDaysAgo: randBetween(1, 8)
    }))
  }

  // Draft apps (3)
  for (let i = 0; i < 3; i++) {
    apps.push(generateApplication({
      status: 'draft',
      assignedToId: null,
      priority: 'normal',
      loanAmount: randBetween(150, 400) * 1000,
      createdDaysAgo: randBetween(1, 15)
    }))
  }

  return apps
}

function buildAssignments(apps: any[]) {
  const records: any[] = []
  const assignedApps = apps.filter(a => a.assignedToId)

  for (const app of assignedApps) {
    records.push({
      applicationId: app.id,
      assignedToId: app.assignedToId!,
      assignedBy: SUPERVISOR.id,
      action: 'assigned',
      note: null,
      createdAt: new Date(app.assignedAt?.getTime() || app.createdAt.getTime() + 86400000)
    })

    if (['approved', 'denied'].includes(app.status)) {
      records.push({
        applicationId: app.id,
        assignedToId: app.assignedToId!,
        assignedBy: app.assignedToId!,
        action: 'completed',
        note: app.status === 'approved' ? 'Application approved' : 'Application denied - risk factors',
        createdAt: app.updatedAt
      })
    }
  }

  const reviewApps = assignedApps.filter(a => a.status === 'in_review')
  if (reviewApps.length >= 2) {
    records.push({
      applicationId: reviewApps[0].id,
      assignedToId: reviewApps[0].assignedToId!,
      assignedBy: SUPERVISOR.id,
      action: 'reassigned',
      note: 'Reassigned for workload balancing',
      createdAt: daysAgo(2)
    })
  }

  return records
}

async function handler(req: any, res: any, user: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  if (!isRole(user, 'SUPERVISOR')) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // Clean existing seed data
  await prisma.assignment.deleteMany({ where: { applicationId: { startsWith: 'seed-' } } })
  await prisma.application.deleteMany({ where: { id: { startsWith: 'seed-' } } })

  // Upsert demo users
  for (const u of [SUPERVISOR, ...CASEWORKERS]) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { id: u.id, email: u.email, name: u.name, role: u.role }
    })
  }

  // Generate and insert applications
  const apps = buildApplications()
  for (const app of apps) {
    await prisma.application.create({ data: app })
  }

  // Generate and insert assignment records
  const assignments = buildAssignments(apps)
  for (const record of assignments) {
    await prisma.assignment.create({ data: record })
  }

  return res.status(200).json({
    message: `Seeded ${apps.length} applications and ${assignments.length} assignment records`,
    applications: apps.length,
    assignments: assignments.length
  })
}

export default withAuth(handler, 'SUPERVISOR')
