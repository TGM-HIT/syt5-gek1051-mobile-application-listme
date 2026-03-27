describe('ID 3: Shopping Lists CRUD', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/lists', {
      statusCode: 200,
      body: [
        { id: '1', name: 'Wocheneinkauf', emoji: '🛒', itemCount: 2, checkedCount: 1, participantCount: 1, updatedAt: new Date().toISOString() }
      ]
    }).as('getLists');

    cy.intercept('POST', '**/api/v1/lists', {
      statusCode: 201,
      body: { id: '2', name: 'Neu Liste', emoji: '🎉', itemCount: 0, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString() }
    }).as('createList');

    cy.intercept('DELETE', '**/api/v1/lists/*', {
      statusCode: 204
    }).as('deleteList');

    cy.visit('/');
    cy.wait('@getLists');
  });

  it('should list existing shopping lists', () => {
    cy.contains('Wocheneinkauf').should('be.visible');
    cy.contains('1/2 items').should('be.visible');
  });

  it('should create a new shopping list', () => {
    cy.get('button[aria-label="Liste erstellen"]').click();
    cy.get('input[placeholder="Name der Liste…"]').type('Neu Liste');
    cy.contains('button', 'Erstellen').click();
    cy.wait('@createList');
    cy.get('@createList').its('request.body').should('include', { name: 'Neu Liste' });
  });

  it('should delete a shopping list', () => {
    cy.get('button[title="Optionen"]').first().click({ force: true });
    cy.contains('button', 'Löschen').click();
    cy.wait('@deleteList');
  });
});
