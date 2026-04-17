describe('ID 10: Item Images', () => {
  const listId = '1';
  const imageUrl = 'https://example.com/milch.jpg';

  beforeEach(() => {
    cy.intercept('GET', '**/api/lists', {
      statusCode: 200,
      body: [{ id: listId, name: 'Test', emoji: '🛒', itemCount: 1, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString() }]
    });
    cy.intercept('GET', `**/api/lists/${listId}/items`, {
      statusCode: 200,
      body: [
        { id: '101', name: 'Milch', checked: false, imageUrl, quantity: null, quantityUnit: null, price: null, labels: [] },
        { id: '102', name: 'Brot', checked: false, imageUrl: null, quantity: null, quantityUnit: null, price: null, labels: [] }
      ]
    }).as('getItems');
    cy.intercept('GET', '**/api/favorites', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/api/lists/*/budget', { statusCode: 200, body: { total: 0, byCategory: {} } });
    cy.visit(`/list/${listId}`);
    cy.wait('@getItems');
  });

  it('should display image thumbnail for items with images', () => {
    cy.get(`img[alt="Milch"]`).should('be.visible').and('have.attr', 'src', imageUrl);
  });

  it('should not display image thumbnail for items without images', () => {
    // Only one image thumbnail should exist (Milch)
    cy.get('img[alt="Milch"]').should('have.length', 1);
    cy.get('img[alt="Brot"]').should('not.exist');
  });

  it('should show image upload button in add-item sheet', () => {
    cy.get('[data-cy="fab-add-item"]').click();
    cy.contains('Bild hinzufügen').should('be.visible');
  });

  it('should show image section label in add-item sheet', () => {
    cy.get('[data-cy="fab-add-item"]').click();
    cy.contains('Bild').should('be.visible');
  });

  it('should show image upload section when editing an item with an existing image', () => {
    cy.intercept('PUT', `**/api/lists/${listId}/items/101`, {
      statusCode: 200,
      body: { id: '101', name: 'Milch', checked: false, imageUrl, quantity: null, quantityUnit: null, price: null, labels: [] }
    }).as('updateItem');

    // Open edit sheet for item with image
    cy.contains('Milch').parents('.pressable').first().within(() => {
      cy.get('.flex.items-center.gap-1').find('button').first().click({ force: true });
    });

    // The image picker should show the existing image thumbnail
    cy.get('img[alt="Item Bild"]').should('be.visible').and('have.attr', 'src', imageUrl);
  });
});