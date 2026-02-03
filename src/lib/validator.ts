import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import urlaCore from '../schemas/urla-core.json'
import urlaFull from '../schemas/urla-full.json'
import mismoSchema from '../schemas/mismo-lite.json'

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

// Register modular subschemas so $ref resolution works when compiling the full schema
import urlaLoan from '../schemas/urla-loan.json'
import urlaProperty from '../schemas/urla-property.json'
import urlaBorrower from '../schemas/urla-borrower.json'
import urlaIncome from '../schemas/urla-income.json'
import urlaAssets from '../schemas/urla-assets.json'
import urlaLiabilities from '../schemas/urla-liabilities.json'
import urlaDeclarations from '../schemas/urla-declarations.json'
import urlaRealEstate from '../schemas/urla-real-estate.json'
import urlaDemographics from '../schemas/urla-demographics.json'

ajv.addSchema(urlaLoan, 'http://example.com/schemas/urla-loan.json')
ajv.addSchema(urlaProperty, 'http://example.com/schemas/urla-property.json')
ajv.addSchema(urlaBorrower, 'http://example.com/schemas/urla-borrower.json')
ajv.addSchema(urlaIncome, 'http://example.com/schemas/urla-income.json')
ajv.addSchema(urlaAssets, 'http://example.com/schemas/urla-assets.json')
ajv.addSchema(urlaLiabilities, 'http://example.com/schemas/urla-liabilities.json')
ajv.addSchema(urlaDeclarations, 'http://example.com/schemas/urla-declarations.json')
ajv.addSchema(urlaRealEstate, 'http://example.com/schemas/urla-real-estate.json')
ajv.addSchema(urlaDemographics, 'http://example.com/schemas/urla-demographics.json')
// Also register local file refs so generator that uses relative refs can resolve them
ajv.addSchema(require('../schemas/urla-loan.json'), './urla-loan.json')
ajv.addSchema(require('../schemas/urla-property.json'), './urla-property.json')
ajv.addSchema(require('../schemas/urla-borrower.json'), './urla-borrower.json')
ajv.addSchema(require('../schemas/urla-income.json'), './urla-income.json')
ajv.addSchema(require('../schemas/urla-assets.json'), './urla-assets.json')
ajv.addSchema(require('../schemas/urla-liabilities.json'), './urla-liabilities.json')
ajv.addSchema(require('../schemas/urla-declarations.json'), './urla-declarations.json')
ajv.addSchema(require('../schemas/urla-real-estate.json'), './urla-real-estate.json')
ajv.addSchema(require('../schemas/urla-demographics.json'), './urla-demographics.json')

const validateUrlaCore = ajv.compile(urlaCore as any)
const validateUrlaFull = ajv.compile(urlaFull as any)
const validateMismo = ajv.compile(mismoSchema as any)

export function validateURLA(data: any, full = false) {
  const valid = full ? validateUrlaFull(data) : validateUrlaCore(data)
  return { valid: Boolean(valid), errors: full ? validateUrlaFull.errors : validateUrlaCore.errors }
}

export function validateMISMO(data: any) {
  const valid = validateMismo(data)
  return { valid: Boolean(valid), errors: validateMismo.errors }
}
