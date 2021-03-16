Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('http://localhost:3000/')
  cy.get('div.panel').within(function () {
    cy.get('input#user').type("admin@trolley.com")
    cy.get('input#password').type("admin3210")

    // Click the button

    cy.get('#login').click()
  })
})