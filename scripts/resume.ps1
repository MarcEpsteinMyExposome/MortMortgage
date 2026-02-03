# PowerShell helper for Windows: reset DB and seed
Write-Host "Resetting dev database and seeding demo data..."
node ./scripts/reset-db.js
npm run dev:seed
Write-Host "Done. Run 'npm run dev' to start the app."