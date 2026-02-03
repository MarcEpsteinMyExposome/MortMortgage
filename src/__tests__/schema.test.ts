import { validateURLA } from '../lib/validator'
import good from '../fixtures/good.json'
import average from '../fixtures/average.json'
import poor from '../fixtures/poor.json'

describe('URLA schema validation (Phase A - core)', () => {
  test('average fixture validates against core schema', () => {
    const { valid } = validateURLA(average as any)
    expect(valid).toBe(true)
  })

  test('poor fixture validates against core schema', () => {
    const { valid } = validateURLA(poor as any)
    expect(valid).toBe(true)
  })

  test('invalid fixture fails (missing product)', () => {
    const bad = { ...average } as any
    delete bad.product
    const { valid } = validateURLA(bad)
    expect(valid).toBe(false)
  })
})

describe('URLA schema validation (Phase B - full)', () => {
  test('good fixture validates against full schema', () => {
    const { valid, errors } = validateURLA(good as any, true)
    expect(valid).toBe(true)
    if (errors) console.log(errors)
  })

  test('full schema requires loan object', () => {
    const bad = { ...good } as any
    delete bad.loan
    const { valid } = validateURLA(bad, true)
    expect(valid).toBe(false)
  })

  test('full schema requires property with all fields', () => {
    const bad = { ...good, property: { address: { street: '123', city: 'Test', state: 'CA', zip: '90001' } } } as any
    const { valid } = validateURLA(bad, true)
    expect(valid).toBe(false) // missing required fields like numberOfUnits, occupancy, etc.
  })
})
