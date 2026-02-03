describe('Borrower identity flow', () => {
  it('lets a user start an application and saves borrower identity', () => {
    cy.visit('http://localhost:3000/apply/new')
    cy.get('input[placeholder="First name"]').type('E2E')
    cy.get('input[placeholder="Last name"]').type('Tester')
    cy.get('input[placeholder="SSN"]').type('123-45-6789')
    cy.get('button').contains('Save & Continue').click()
    // After submission we should be redirected to /apply/:id
    cy.url().should('match', /\/apply\/[a-z0-9-]+/)
    cy.contains('Application:')
  })
})