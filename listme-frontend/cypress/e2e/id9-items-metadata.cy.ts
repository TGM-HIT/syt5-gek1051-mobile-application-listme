describe('ID 9: Item Quantities, Units, and Labels', () => {
  const listId = '1';

  beforeEach(() => {
    cy.intercept('GET', '**/api/lists', {
      statusCode: 200,
      body: [{ id: listId, name: 'Test', emoji: '🛒', itemCount: 2, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString() }]
    });
    cy.intercept('GET', `**/api/lists/${listId}/items`, {
      statusCode: 200,
      body: [
        { id: '101', name: 'Milch', checked: false, quantity: 2, quantityUnit: 'L', price: 1.99, labels: [{ id: 'l1', name: 'Bio' }] },
        { id: '102', name: 'Mehl', checked: false, quantity: 500, quantityUnit: 'g', price: null, labels: [] }
      ]
    }).as('getItems');
    cy.intercept('GET', '**/api/favorites', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/api/lists/*/budget', { statusCode: 200, body: { total: 1.99, byCategory: {} } });
    cy.intercept('GET', '**/api/labels', { statusCode: 200, body: [{ id: 'l1', name: 'Bio', color: '#a6e3a1' }] });
    cy.visit(`/list/${listId}`);
    cy.wait('@getItems');
  });

  it('should display item quantity and unit', () => {
    cy.contains('2 L').should('be.visible');
    cy.contains('500 g').should('be.visible');
  });

  it('should display item price', () => {
    cy.contains('1.99').should('be.visible');
  });

  it('should display item label', () => {
    cy.contains('Bio').should('be.visible');
  });

  it('should open add-item sheet and show unit selector buttons', () => {
    cy.get('[data-cy="fab-add-item"]').click();
    // Unit toggle buttons should be visible
    cy.contains('button', 'Stk.').should('be.visible');
    cy.contains('button', 'kg').should('be.visible');
    cy.contains('button', 'g').should('be.visible');
    cy.contains('button', 'L').should('be.visible');
    cy.contains('button', 'ml').should('be.visible');
  });

  it('should submit item with quantity and unit', () => {
    cy.intercept('POST', `**/api/lists/${listId}/items`, {
      statusCode: 201,
      body: { id: '103', name: 'Zucker', checked: false, quantity: 1, quantityUnit: 'kg', price: null, labels: [] }
    }).as('createItem');

    cy.get('[data-cy="fab-add-item"]').click();
    cy.get('input[placeholder="z.B. Milch, Brot, Äpfel..."]').type('Zucker');
    cy.get('input[placeholder="Menge"]').type('1');
    cy.contains('button', 'kg').click();
    cy.contains('button', 'Hinzufügen').click();
    cy.wait('@createItem');

    cy.get('@createItem').its('request.body').should('deep.include', { name: 'Zucker', quantity: 1, quantityUnit: 'kg' });
  });

  it('should submit item with price', () => {
    cy.intercept('POST', `**/api/lists/${listId}/items`, {
      statusCode: 201,
      body: { id: '104', name: 'Butter', checked: false, quantity: null, quantityUnit: null, price: 2.50, labels: [] }
    }).as('createItem');

    cy.get('[data-cy="fab-add-item"]').click();
    cy.get('input[placeholder="z.B. Milch, Brot, Äpfel..."]').type('Butter');
    cy.get('input[placeholder="0.00"]').type('2.50');
    cy.contains('button', 'Hinzufügen').click();
    cy.wait('@createItem');

    cy.get('@createItem').its('request.body').should('deep.include', { name: 'Butter', price: 2.50 });
  });
});