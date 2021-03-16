describe('Test group', function () {

  beforeEach(function () {
    cy.loginAsAdmin()
  })

  it('should be able to create a group', function () {

    cy.get('ul#side-menu').within(function () {
      cy.get('#adminMenu > [href="#"]').click()
      cy.get('#toGroupManagement').click()
      cy.url().should('include', '/admin/groups')
    })
    cy.get('.page-header').should('contain', 'Gruppenverwaltung')

    cy.get('.insert-panel > .panel-body').within(function () {
      // Name
      cy.get('#inputGroupName').type("test-group")

      // Details
      cy.get("textarea[name='additional']").type("additional")

      // Email
      cy.get("input[name='email']").type("mytest@example.org")

      // Coordinator
      cy.get("div.select2-container").click()
    })
    // Choose Admin User
    cy.get("div.select2-result-label").click()

    cy.get('#saveButton').click()

    // Group should be visible above
    cy.get(".dataTables_wrapper").contains('test-group')

  })
})