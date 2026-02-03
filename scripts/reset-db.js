const fs = require('fs')
const { execSync } = require('child_process')
const path = require('path')

const dbPath = path.resolve(process.cwd(), 'dev.db')
if (fs.existsSync(dbPath)) {
  console.log('Removing dev.db...')
  fs.unlinkSync(dbPath)
}
console.log('Running prisma migrate to create schema...')
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })
} catch (e) {
  console.warn('migrate deploy failed (expected in some dev setups). You can run `npx prisma migrate dev --name init` manually.')
}
console.log('Reset complete.')
