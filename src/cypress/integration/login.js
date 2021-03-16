describe('Test signup', function () {

  beforeEach(function () {
    cy.visit('http://localhost:3000/')
  })

  it('.should() - assert that signup panel has every input field needed', function () {

    cy.get('div.panel').within(function () {

      // Some assertions using a custom helper

      isEnabledAndVisible('input#login')
      isEnabledAndVisible('input#user')
      isEnabledAndVisible('input#password')

      // // Enter some data

      cy.get('input#user').type("admin@trolley.com")
      cy.get('input#password').type("admin3210")

      // // Click the button

      cy.get('#login').click()

      // Validate the new url

    })

    cy.get('div#page-wrapper').within(function () {
      isVisible('#greeting')
    })
  })

})

// Helpers
function isEnabledAndVisible(element) {
  cy.get(element).should('exist').and('be.visible').and('be.enabled')
}

function isVisible(element) {
  cy.get(element).should('exist').and('be.visible')
}