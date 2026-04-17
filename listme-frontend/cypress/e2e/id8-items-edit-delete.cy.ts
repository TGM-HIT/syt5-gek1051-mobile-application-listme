describe('ID 8: Edit and Delete Items', () => {
  const listId = '1';
  const item = { id: '101', name: 'Milch', checked: false, quantity: null, quantityUnit: null, price: null, imageUrl: null, labels: [] };

  beforeEach(() => {
    cy.intercept('GET', '**/api/lists', {
      statusCode: 200,
      body: [{ id: listId, name: 'Test', emoji: '🛒', itemCount: 1, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString() }]
    });
    cy.intercept('GET', `**/api/lists/${listId}/items`, {
      statusCode: 200,
      body: [item]
    }).as('getItems');
    cy.intercept('GET', '**/api/favorites', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/api/lists/*/budget', { statusCode: 200, body: { total: 0, byCategory: {} } });
    cy.visit(`/list/${listId}`);
    cy.wait('@getItems');
  });

  it('should display the item in the list', () => {
    cy.contains('Milch').should('be.visible');
  });

  it('should open edit sheet when edit button is clicked', () => {
    cy.intercept('PUT', `**/api/lists/${listId}/items/${item.id}`, {
      statusCode: 200,
      body: { ...item, name: 'Milch (Bio)' }
    }).as('updateItem');

    // Hover to reveal action buttons, then click edit (first action button)
    cy.contains('Milch').parents('.pressable').first().within(() => {
      cy.get('.flex.items-center.gap-1').find('button').first().click({ force: true });
    });

    // AddItemSheet should open pre-filled with item name
    cy.get('input[placeholder="z.B. Milch, Brot, Äpfel..."]').should('have.value', 'Milch');
  });

  it('should save edited item name', () => {
    cy.intercept('PUT', `**/api/lists/${listId}/items/${item.id}`, {
      statusCode: 200,
      body: { ...item, name: 'Milch (Bio)' }
    }).as('updateItem');

    cy.contains('Milch').parents('.pressable').first().within(() => {
      cy.get('.flex.items-center.gap-1').find('button').first().click({ force: true });
    });

    cy.get('input[placeholder="z.B. Milch, Brot, Äpfel..."]').clear().type('Milch (Bio)');
    cy.contains('button', 'Speichern').click();
    cy.wait('@updateItem');
    cy.get('@updateItem').its('request.body').should('deep.include', { name: 'Milch (Bio)' });
  });

  it('should delete an item when delete button is clicked', () => {
    cy.intercept('DELETE', `**/api/lists/${listId}/items/${item.id}`, {
      statusCode: 204
    }).as('deleteItem');

    // Hover to reveal action buttons, then click delete (second action button)
    cy.contains('Milch').parents('.pressable').first().within(() => {
      cy.get('.flex.items-center.gap-1').find('button').eq(1).click({ force: true });
    });

    cy.wait('@deleteItem');
  });

  it('should add a new item via FAB', () => {
    cy.intercept('POST', `**/api/lists/${listId}/items`, {
      statusCode: 201,
      body: { id: '102', name: 'Brot', checked: false, quantity: null, quantityUnit: null, price: null, imageUrl: null, labels: [] }
    }).as('createItem');

    cy.get('[data-cy="fab-add-item"]').click();
    cy.get('input[placeholder="z.B. Milch, Brot, Äpfel..."]').type('Brot');
    cy.contains('button', 'Hinzufügen').click();
    cy.wait('@createItem');
    cy.get('@createItem').its('request.body').should('deep.include', { name: 'Brot' });
  });
});