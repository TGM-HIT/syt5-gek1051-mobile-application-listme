describe('ID 2: Check/Uncheck Items', () => {
  const listId = '1';
  const item = { id: '101', name: 'Milch', checked: false };

  beforeEach(() => {
    cy.intercept('GET', `**/api/v1/lists/${listId}/items`, {
      statusCode: 200,
      body: [item]
    }).as('getItems');

    cy.intercept('PATCH', `**/api/v1/lists/${listId}/items/${item.id}/toggle`, {
      statusCode: 200
    }).as('toggleItem');

    cy.visit(`/list/${listId}`);
    cy.wait('@getItems');
  });

  it('should toggle an item from unchecked to checked', () => {
    cy.contains('Milch').should('be.visible');
    cy.get('button[aria-label="Artikel erledigen"]').click();
    cy.wait('@toggleItem');
    // The UI should update (opacity or line-through)
    cy.contains('div', 'Milch').parent().should('have.class', 'opacity-50');
  });

  it('should toggle an item from checked back to unchecked', () => {
    // Mock checked item
    cy.intercept('GET', `**/api/v1/lists/${listId}/items`, {
      statusCode: 200,
      body: [{ ...item, checked: true }]
    }).as('getItemsChecked');
    
    cy.visit(`/list/${listId}`);
    cy.wait('@getItemsChecked');

    cy.get('button[aria-label="Als offen markieren"]').click();
    cy.wait('@toggleItem');
    cy.contains('div', 'Milch').parent().should('not.have.class', 'opacity-50');
  });
});
