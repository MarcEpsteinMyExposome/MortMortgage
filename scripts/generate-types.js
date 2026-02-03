const fs = require('fs')
const path = require('path')
const { compile } = require('json-schema-to-typescript')

async function gen(src, dest) {
  const schema = require(src)
  const ts = await compile(schema, path.basename(dest, '.d.ts'), { bannerComment: '' })
  fs.writeFileSync(dest, ts, 'utf-8')
  console.log(`Generated: ${dest}`)
}

async function main() {
  const outDir = path.resolve(__dirname, '..', 'src', 'types')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  // Generate types for component schemas
  await gen(path.resolve(__dirname, '..', 'src', 'schemas', 'urla-borrower.json'), path.join(outDir, 'urla-borrower.d.ts'))
  await gen(path.resolve(__dirname, '..', 'src', 'schemas', 'urla-loan.json'), path.join(outDir, 'urla-loan.d.ts'))
  await gen(path.resolve(__dirname, '..', 'src', 'schemas', 'urla-property.json'), path.join(outDir, 'urla-property.d.ts'))
  await gen(path.resolve(__dirname, '..', 'src', 'schemas', 'urla-income.json'), path.join(outDir, 'urla-income.d.ts'))
  await gen(path.resolve(__dirname, '..', 'src', 'schemas', 'urla-assets.json'), path.join(outDir, 'urla-assets.d.ts'))
  await gen(path.resolve(__dirname, '..', 'src', 'schemas', 'urla-liabilities.json'), path.join(outDir, 'urla-liabilities.d.ts'))
  await gen(path.resolve(__dirname, '..', 'src', 'schemas', 'urla-declarations.json'), path.join(outDir, 'urla-declarations.d.ts'))

  // Build a merged full schema by inlining component schemas into definitions so compile can work without remote file resolution
  const fullPath = path.resolve(__dirname, '..', 'src', 'schemas', 'urla-full.json')
  const fullSchema = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
  const defs = fullSchema.definitions || {}
  for (const key of Object.keys(defs)) {
    const ref = defs[key].$ref
    if (ref && ref.startsWith('./')) {
      const compPath = path.resolve(path.dirname(fullPath), ref)
      defs[key] = JSON.parse(fs.readFileSync(compPath, 'utf-8'))
    }
  }
  fullSchema.definitions = defs
  // adjust property refs to point to local definitions
  for (const prop of ['loan','property','borrowers','income','assets','liabilities','declarations']) {
    if (fullSchema.properties && fullSchema.properties[prop] && fullSchema.properties[prop].$ref) {
      const refUrl = fullSchema.properties[prop].$ref
      const fileName = path.basename(refUrl)
      const defName = Object.keys(defs).find((k) => refUrl.endsWith(k + '.json') || refUrl.endsWith(fileName))
      if (defName) {
        fullSchema.properties[prop] = { $ref: `#/definitions/${defName}` }
      }
    }
    if (prop === 'borrowers' && fullSchema.properties.borrowers && fullSchema.properties.borrowers.items && fullSchema.properties.borrowers.items.$ref) {
      const refUrl = fullSchema.properties.borrowers.items.$ref
      const defName = Object.keys(defs).find((k) => refUrl.endsWith(k + '.json'))
      if (defName) {
        fullSchema.properties.borrowers.items = { $ref: `#/definitions/${defName}` }
      }
    }
  }

  // Compile merged full schema
  const fullTs = await compile(fullSchema, 'URLAFull', { bannerComment: '' })
  fs.writeFileSync(path.join(outDir, 'urla-full.d.ts'), fullTs, 'utf-8')
  console.log('Generated: src/types/urla-full.d.ts')

  console.log('All types generated.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})