import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Caseworker demo users
const CASEWORKERS = [
  { id: 'demo-caseworker-1', email: 'caseworker1@demo.com', name: 'Sarah Chen', role: 'CASEWORKER' },
  { id: 'demo-caseworker-2', email: 'caseworker2@demo.com', name: 'James Wilson', role: 'CASEWORKER' },
  { id: 'demo-caseworker-3', email: 'caseworker3@demo.com', name: 'Priya Patel', role: 'CASEWORKER' },
  { id: 'demo-caseworker-4', email: 'caseworker4@demo.com', name: 'Marcus Johnson', role: 'CASEWORKER' }
]

const SUPERVISOR = { id: 'demo-supervisor-1', email: 'supervisor@demo.com', name: 'Maria Rodriguez', role: 'SUPERVISOR' }

// Name pools
const FIRST_NAMES = ['Michael', 'Jennifer', 'Robert', 'Patricia', 'David', 'Linda', 'William', 'Barbara', 'Richard', 'Susan',
  'Charles', 'Jessica', 'Joseph', 'Sarah', 'Thomas', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa',
  'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra', 'Steven', 'Ashley', 'Paul', 'Dorothy',
  'Andrew', 'Kimberly', 'Joshua', 'Emily', 'Kenneth', 'Donna', 'Kevin', 'Michelle', 'Brian', 'Carol']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores']

const STREETS = ['Oak Lane', 'Maple Drive', 'Cedar Court', 'Elm Street', 'Pine Avenue', 'Birch Way', 'Willow Road', 'Spruce Circle',
  'Chestnut Boulevard', 'Sycamore Lane', 'Walnut Drive', 'Ash Street', 'Poplar Court', 'Magnolia Avenue', 'Cypress Way',
  'Hickory Road', 'Juniper Circle', 'Redwood Lane', 'Cherry Drive', 'Dogwood Street']
const CITIES = ['Austin', 'Denver', 'Portland', 'Nashville', 'Charlotte', 'Phoenix', 'San Diego', 'Tampa',
  'Raleigh', 'Minneapolis', 'Salt Lake City', 'Boise', 'Asheville', 'Savannah', 'Charleston']
const STATES = ['TX', 'CO', 'OR', 'TN', 'NC', 'AZ', 'CA', 'FL', 'NC', 'MN', 'UT', 'ID', 'NC', 'GA', 'SC']
const EMPLOYERS = ['Acme Corp', 'TechVista Solutions', 'Global Industries', 'Pinnacle Services', 'Summit Healthcare',
  'Meridian Financial', 'Horizon Technologies', 'Atlas Manufacturing', 'Vertex Engineering', 'Nova Consulting']

const PROPERTY_TYPES = ['single_family', 'single_family', 'single_family', 'single_family', 'single_family', 'single_family',
  'condo', 'condo', 'townhouse', 'multi_family']
const LOAN_TYPES = ['Conventional', 'Conventional', 'Conventional', 'FHA', 'VA']

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

function generateApplication(config: AppConfig) {
  const firstName = pick(FIRST_NAMES)
  const lastName = pick(LAST_NAMES)
  const cityIdx = randBetween(0, CITIES.length - 1)
  const loanAmount = config.loanAmount || randBetween(150, 750) * 1000
  const propertyValue = config.propertyValue || Math.round(loanAmount / (0.6 + Math.random() * 0.35))
  const monthlyIncome = config.monthlyIncome || randBetween(5000, 15000)
  const monthlyDebt = config.monthlyDebt || randBetween(200, 2000)
  const streetNum = randBetween(100, 9999)
  const createdAt = daysAgo(config.createdDaysAgo || randBetween(5, 60))
  const updatedAt = config.updatedDaysAgo !== undefined ? daysAgo(config.updatedDaysAgo) : createdAt

  let slaDeadline: Date | null = null
  if (config.slaOverdue) {
    slaDeadline = daysAgo(randBetween(1, 5))
  } else if (config.slaAtRisk) {
    slaDeadline = new Date(Date.now() + randBetween(2, 20) * 3600000) // 2-20 hours from now
  } else if (config.assignedToId && !['approved', 'denied'].includes(config.status)) {
    slaDeadline = new Date(Date.now() + randBetween(2, 10) * 86400000) // 2-10 days out
  }

  const data = {
    loan: {
      loanAmount,
      loanType: pick(LOAN_TYPES),
      loanPurpose: Math.random() > 0.3 ? 'purchase' : 'refinance',
      loanTermMonths: Math.random() > 0.3 ? 360 : 180,
      interestRateType: 'fixed',
      downPayment: {
        amount: propertyValue - loanAmount,
        source: 'savings'
      }
    },
    property: {
      address: {
        street: `${streetNum} ${pick(STREETS)}`,
        city: CITIES[cityIdx],
        state: STATES[cityIdx],
        zip: String(randBetween(10000, 99999))
      },
      propertyType: pick(PROPERTY_TYPES),
      propertyValue,
      occupancy: 'primary_residence',
      numberOfUnits: 1,
      yearBuilt: randBetween(1960, 2023)
    },
    liabilities: {
      liabilities: [
        {
          type: 'credit_card',
          creditor: 'Chase',
          balance: randBetween(2000, 15000),
          monthlyPayment: Math.round(monthlyDebt * 0.4)
        },
        {
          type: 'auto_loan',
          creditor: 'Toyota Financial',
          balance: randBetween(5000, 30000),
          monthlyPayment: Math.round(monthlyDebt * 0.6)
        }
      ]
    },
    assets: {
      assets: [
        {
          type: 'checking',
          institution: 'Bank of America',
          balance: randBetween(10000, 80000)
        },
        {
          type: 'savings',
          institution: 'Ally Bank',
          balance: randBetween(20000, 150000)
        }
      ]
    },
    declarations: {
      declarations: {
        outstandingJudgments: false,
        bankruptcy: false,
        foreclosure: false,
        lawsuit: false,
        loanDefault: false
      }
    }
  }

  const borrowers = [
    {
      name: { firstName, lastName },
      ssn: `${randBetween(100, 999)}-${randBetween(10, 99)}-${randBetween(1000, 9999)}`,
      dob: `${randBetween(1960, 1995)}-${String(randBetween(1, 12)).padStart(2, '0')}-${String(randBetween(1, 28)).padStart(2, '0')}`,
      citizenship: 'us_citizen',
      contact: {
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
        cellPhone: `(${randBetween(200, 999)}) ${randBetween(200, 999)}-${randBetween(1000, 9999)}`
      },
      currentAddress: {
        address: {
          street: `${randBetween(100, 9999)} ${pick(STREETS)}`,
          city: CITIES[cityIdx],
          state: STATES[cityIdx],
          zip: String(randBetween(10000, 99999))
        },
        housingType: Math.random() > 0.5 ? 'own' : 'rent',
        monthlyRent: randBetween(1200, 3000),
        durationYears: randBetween(1, 10),
        durationMonths: randBetween(0, 11)
      },
      employment: [
        {
          employerName: pick(EMPLOYERS),
          position: pick(['Software Engineer', 'Sales Manager', 'Nurse', 'Teacher', 'Accountant', 'Marketing Director', 'Project Manager', 'Analyst']),
          monthlyIncome,
          current: true,
          startDate: `${randBetween(2015, 2023)}-01-01`
        }
      ]
    }
  ]

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

async function main() {
  console.log('Seeding caseworker demo data...')

  // Upsert supervisor and caseworkers
  for (const user of [SUPERVISOR, ...CASEWORKERS]) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, role: user.role },
      create: { id: user.id, email: user.email, name: user.name, role: user.role }
    })
    console.log(`Upserted user: ${user.name} (${user.role})`)
  }

  // Clean existing seed data
  await prisma.assignment.deleteMany({ where: { applicationId: { startsWith: 'seed-' } } })
  await prisma.application.deleteMany({ where: { id: { startsWith: 'seed-' } } })

  const apps: any[] = []

  // Sarah Chen: 7 active + 6 completed (top performer, 90% approval)
  // Active
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[0].id, priority: 'urgent', slaOverdue: true, loanAmount: 520000, createdDaysAgo: 25 }))
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[0].id, priority: 'high', slaAtRisk: true, loanAmount: 380000, createdDaysAgo: 18 }))
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[0].id, priority: 'normal', loanAmount: 290000, createdDaysAgo: 12 }))
  apps.push(generateApplication({ status: 'pending_documents', assignedToId: CASEWORKERS[0].id, priority: 'high', loanAmount: 450000, createdDaysAgo: 20 }))
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[0].id, priority: 'normal', loanAmount: 310000, createdDaysAgo: 8 }))
  apps.push(generateApplication({ status: 'submitted', assignedToId: CASEWORKERS[0].id, priority: 'normal', loanAmount: 275000, createdDaysAgo: 5 }))
  apps.push(generateApplication({ status: 'pending_documents', assignedToId: CASEWORKERS[0].id, priority: 'low', loanAmount: 195000, createdDaysAgo: 3 }))
  // Completed (5 approved, 1 denied = ~83%)
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
  // Completed (3 approved, 1 denied)
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[1].id, priority: 'normal', loanAmount: 300000, createdDaysAgo: 48, updatedDaysAgo: 33 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[1].id, priority: 'normal', loanAmount: 380000, createdDaysAgo: 52, updatedDaysAgo: 38 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[1].id, priority: 'normal', loanAmount: 275000, createdDaysAgo: 44, updatedDaysAgo: 30 }))
  apps.push(generateApplication({ status: 'denied', assignedToId: CASEWORKERS[1].id, priority: 'normal', loanAmount: 600000, propertyValue: 620000, monthlyIncome: 5500, monthlyDebt: 2800, createdDaysAgo: 46, updatedDaysAgo: 32 }))

  // Priya Patel: 4 active + 5 completed (fast, 60% approval)
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[2].id, priority: 'normal', slaAtRisk: true, loanAmount: 360000, createdDaysAgo: 14 }))
  apps.push(generateApplication({ status: 'submitted', assignedToId: CASEWORKERS[2].id, priority: 'high', loanAmount: 290000, createdDaysAgo: 7 }))
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[2].id, priority: 'normal', loanAmount: 400000, createdDaysAgo: 11 }))
  apps.push(generateApplication({ status: 'pending_documents', assignedToId: CASEWORKERS[2].id, priority: 'normal', loanAmount: 225000, createdDaysAgo: 9 }))
  // Completed (3 approved, 2 denied)
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[2].id, priority: 'normal', loanAmount: 320000, createdDaysAgo: 38, updatedDaysAgo: 26 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[2].id, priority: 'normal', loanAmount: 250000, createdDaysAgo: 42, updatedDaysAgo: 30 }))
  apps.push(generateApplication({ status: 'approved', assignedToId: CASEWORKERS[2].id, priority: 'normal', loanAmount: 380000, createdDaysAgo: 50, updatedDaysAgo: 36 }))
  apps.push(generateApplication({ status: 'denied', assignedToId: CASEWORKERS[2].id, priority: 'normal', loanAmount: 550000, propertyValue: 560000, monthlyIncome: 5000, monthlyDebt: 2500, createdDaysAgo: 47, updatedDaysAgo: 35 }))
  apps.push(generateApplication({ status: 'denied', assignedToId: CASEWORKERS[2].id, priority: 'normal', loanAmount: 480000, propertyValue: 500000, monthlyIncome: 5200, monthlyDebt: 3000, createdDaysAgo: 44, updatedDaysAgo: 31 }))

  // Marcus Johnson: 3 active + 3 completed (newer, 67% approval)
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[3].id, priority: 'normal', loanAmount: 240000, createdDaysAgo: 10 }))
  apps.push(generateApplication({ status: 'submitted', assignedToId: CASEWORKERS[3].id, priority: 'normal', loanAmount: 310000, createdDaysAgo: 5 }))
  apps.push(generateApplication({ status: 'in_review', assignedToId: CASEWORKERS[3].id, priority: 'high', slaAtRisk: true, loanAmount: 400000, createdDaysAgo: 16 }))
  // Completed (2 approved, 1 denied)
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

  // Create all applications
  for (const app of apps) {
    await prisma.application.create({ data: app })
  }
  console.log(`Created ${apps.length} applications`)

  // Create assignment history records
  const assignedApps = apps.filter(a => a.assignedToId)
  const assignmentRecords = []

  for (const app of assignedApps) {
    // Initial assignment
    assignmentRecords.push({
      applicationId: app.id,
      assignedToId: app.assignedToId!,
      assignedBy: SUPERVISOR.id,
      action: 'assigned',
      note: null,
      createdAt: new Date(app.assignedAt?.getTime() || app.createdAt.getTime() + 86400000)
    })

    // Some completed apps get a "completed" action
    if (['approved', 'denied'].includes(app.status)) {
      assignmentRecords.push({
        applicationId: app.id,
        assignedToId: app.assignedToId!,
        assignedBy: app.assignedToId!,
        action: 'completed',
        note: app.status === 'approved' ? 'Application approved' : 'Application denied - risk factors',
        createdAt: app.updatedAt
      })
    }
  }

  // Add a few reassignment records for interest
  const reviewApps = assignedApps.filter(a => a.status === 'in_review')
  if (reviewApps.length >= 2) {
    assignmentRecords.push({
      applicationId: reviewApps[0].id,
      assignedToId: reviewApps[0].assignedToId!,
      assignedBy: SUPERVISOR.id,
      action: 'reassigned',
      note: 'Reassigned for workload balancing',
      createdAt: daysAgo(2)
    })
  }

  for (const record of assignmentRecords) {
    await prisma.assignment.create({ data: record })
  }
  console.log(`Created ${assignmentRecords.length} assignment records`)

  console.log('Caseworker seed data complete!')
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
