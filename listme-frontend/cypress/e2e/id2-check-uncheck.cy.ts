describe('ID 2: Check/Uncheck Items', () => {
  const listId = '1';
  const item = { id: '101', name: 'Milch', checked: false };

  beforeEach(() => {
    cy.intercept('GET', '**/api/lists', {
      statusCode: 200,
      body: [{ id: listId, name: 'Test', emoji: '🛒', itemCount: 1, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString() }]
    }).as('getLists');

    cy.intercept('GET', `**/api/lists/${listId}/items`, {
      statusCode: 200,
      body: [item]
    }).as('getItems');

    cy.intercept('PATCH', `**/api/lists/${listId}/items/${item.id}/check`, {
      statusCode: 200,
      body: { ...item, checked: true }
    }).as('toggleItem');

    cy.visit(`/list/${listId}`);
    cy.wait('@getItems');
  });

  it('should toggle an item from unchecked to checked', () => {
    cy.contains('Milch').should('be.visible');
    cy.get('button[aria-label="Artikel erledigen"]').click();
    cy.wait('@toggleItem');
  });

  it('should show checked item with strikethrough and reduced opacity', () => {
    cy.intercept('GET', `**/api/lists/${listId}/items`, {
      statusCode: 200,
      body: [{ ...item, checked: true }]
    }).as('getItemsChecked');

    cy.visit(`/list/${listId}`);
    cy.wait('@getItemsChecked');

    // Checked items have opacity-50 on the row container
    cy.get('.opacity-50').should('exist');
    cy.get('button[aria-label="Als offen markieren"]').should('exist');
  });

  it('should toggle an item from checked back to unchecked', () => {
    cy.intercept('GET', `**/api/lists/${listId}/items`, {
      statusCode: 200,
      body: [{ ...item, checked: true }]
    }).as('getItemsChecked');

    cy.intercept('PATCH', `**/api/lists/${listId}/items/${item.id}/check`, {
      statusCode: 200,
      body: { ...item, checked: false }
    }).as('untoggleItem');

    cy.visit(`/list/${listId}`);
    cy.wait('@getItemsChecked');

    cy.get('button[aria-label="Als offen markieren"]').click();
    cy.wait('@untoggleItem');
  });
});
