import { validateURLA } from '../lib/validator'
import incomeEdge from '../fixtures/income-edge.json'
import assetsLiabilities from '../fixtures/assets-liabilities.json'
import invalid from '../fixtures/invalid-missing-address.json'

describe('URLA extended schema validation (Phase B - extended)', () => {
  test('income edge fixture validates', () => {
    const { valid, errors } = validateURLA(incomeEdge as any, true)
    expect(valid).toBe(true)
    if (errors) console.log(errors)
  })

  test('assets & liabilities fixture validates', () => {
    const { valid } = validateURLA(assetsLiabilities as any, true)
    expect(valid).toBe(true)
  })

  test('invalid fixture still fails', () => {
    const { valid } = validateURLA(invalid as any, true)
    expect(valid).toBe(false)
  })
})