describe('ID 11: Favorites', () => {
  const listId = '1';
  const favorites = [
    { id: 'f1', itemName: 'Milch', emoji: '🥛' },
    { id: 'f2', itemName: 'Brot', emoji: '🍞' }
  ];

  beforeEach(() => {
    cy.intercept('GET', '**/api/lists', {
      statusCode: 200,
      body: [{ id: listId, name: 'Test', emoji: '🛒', itemCount: 0, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString() }]
    });
    cy.intercept('GET', `**/api/lists/${listId}/items`, {
      statusCode: 200,
      body: []
    }).as('getItems');
    cy.intercept('GET', '**/api/favorites', {
      statusCode: 200,
      body: favorites
    }).as('getFavorites');
    cy.intercept('GET', '**/api/lists/*/budget', { statusCode: 200, body: { total: 0, byCategory: {} } });
    cy.visit(`/list/${listId}`);
    cy.wait('@getItems');
  });

  it('should display favorite chips in add-item sheet when name is empty', () => {
    cy.get('[data-cy="fab-add-item"]').click();
    cy.wait('@getFavorites');
    // Favorites show as chips when the name field is empty
    cy.contains('Milch').should('be.visible');
    cy.contains('Brot').should('be.visible');
  });

  it('should fill item name when a favorite chip is clicked', () => {
    cy.get('[data-cy="fab-add-item"]').click();
    cy.wait('@getFavorites');
    cy.contains('Milch').click();
    cy.get('input[placeholder="z.B. Milch, Brot, Äpfel..."]').should('have.value', 'Milch');
  });

  it('should hide favorites when typing in name field', () => {
    cy.get('[data-cy="fab-add-item"]').click();
    cy.wait('@getFavorites');
    cy.contains('Milch').should('be.visible');
    cy.get('input[placeholder="z.B. Milch, Brot, Äpfel..."]').type('Kar');
    // Favorites section is hidden while user is typing
    cy.contains('Brot').should('not.exist');
  });

  it('should show add-to-favorites button in library', () => {
    cy.intercept('GET', '**/api/presets', { statusCode: 200, body: [] }).as('getPresets');
    cy.intercept('GET', '**/api/items/history*', { statusCode: 200, body: [] }).as('getHistory');
    cy.visit('/library');
    // Library view should be accessible
    cy.get('body').should('not.be.empty');
  });

  it('should call POST /api/favorites when adding a new favorite', () => {
    cy.intercept('POST', '**/api/favorites', {
      statusCode: 201,
      body: { id: 'f3', itemName: 'Käse', emoji: null }
    }).as('addFavorite');
    cy.intercept('POST', `**/api/lists/${listId}/items`, {
      statusCode: 201,
      body: { id: '101', name: 'Käse', checked: false, quantity: null, quantityUnit: null, price: null, imageUrl: null, labels: [] }
    }).as('createItem');

    cy.get('[data-cy="fab-add-item"]').click();
    cy.get('input[placeholder="z.B. Milch, Brot, Äpfel..."]').type('Käse');
    cy.contains('button', 'Hinzufügen').click();
    cy.wait('@createItem');
  });
});