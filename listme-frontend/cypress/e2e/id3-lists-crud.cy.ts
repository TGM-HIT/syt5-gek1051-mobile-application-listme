describe('ID 3: Shopping Lists CRUD', () => {
  const list = {
    id: '1',
    name: 'Wocheneinkauf',
    emoji: '🛒',
    itemCount: 2,
    checkedCount: 1,
    participantCount: 1,
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    cy.intercept('GET', '**/api/lists', { statusCode: 200, body: [list] }).as('getLists');

    cy.intercept('POST', '**/api/lists', {
      statusCode: 201,
      body: { id: '2', name: 'Neue Liste', emoji: '🎉', itemCount: 0, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString() }
    }).as('createList');

    cy.intercept('DELETE', '**/api/lists/*', { statusCode: 204 }).as('deleteList');

    cy.visit('/');
    cy.wait('@getLists');
  });

  it('should display existing shopping lists with item counts', () => {
    cy.contains('Wocheneinkauf').should('be.visible');
    cy.contains('1/2 items').should('be.visible');
  });

  it('should create a new shopping list', () => {
    cy.get('button[aria-label="Liste erstellen"]').click();
    cy.get('input[placeholder="Name der Liste…"]').type('Neue Liste');
    cy.contains('button', 'Erstellen').click();
    cy.wait('@createList');
    cy.get('@createList').its('request.body').should('deep.include', { name: 'Neue Liste' });
  });

  it('should delete a shopping list via context menu', () => {
    cy.get('button[title="Optionen"]').click({ force: true });
    cy.contains('button', 'Löschen').first().click();
    cy.wait('@deleteList');
  });

  it('should navigate to list detail when clicking a list', () => {
    cy.intercept('GET', '**/api/lists/1/items', { statusCode: 200, body: [] }).as('getItems');
    cy.contains('Wocheneinkauf').click();
    cy.url().should('include', '/list/1');
  });
});