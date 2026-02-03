import { validateURLA } from '../lib/validator'
import co from '../fixtures/co-borrower.json'
import invalid from '../fixtures/invalid-missing-address.json'

describe('URLA full schema validation (Phase B)', () => {
  test('co-borrower fixture validates against full schema', () => {
    const { valid, errors } = validateURLA(co as any, true)
    expect(valid).toBe(true)
    if (errors) console.log(errors)
  })

  test('invalid fixture fails (missing address)', () => {
    const { valid, errors } = validateURLA(invalid as any, true)
    expect(valid).toBe(false)
    expect(errors).toBeTruthy()
  })
})
