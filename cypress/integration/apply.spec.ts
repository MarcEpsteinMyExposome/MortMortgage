describe('Application flow (demo)', () => {
  it('Loads the home page and opens application', () => {
    cy.visit('http://localhost:3000')
    cy.contains('Start Application').click()
    // Since pages are stubbed, just assert navigation
    cy.url().should('include', '/apply')
  })
})