describe('ID 4: Items with Categories and Search', () => {
  const listId = '1';

  beforeEach(() => {
    cy.intercept('GET', '**/api/lists', {
      statusCode: 200,
      body: [{ id: listId, name: 'Test', emoji: '🛒', itemCount: 2, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString() }]
    });

    cy.intercept('GET', `**/api/lists/${listId}/items`, {
      statusCode: 200,
      body: [
        { id: '101', name: 'Milch', checked: false, categoryName: 'Molkerei', categoryColor: '#a6e3a1' },
        { id: '102', name: 'Brot', checked: false, categoryName: 'Bäckerei', categoryColor: '#fab387' }
      ]
    }).as('getItems');

    cy.visit(`/list/${listId}`);
    cy.wait('@getItems');
  });

  it('should display items with their categories', () => {
    cy.contains('Milch').should('be.visible');
    cy.contains('Molkerei').should('be.visible');
    cy.contains('Brot').should('be.visible');
    cy.contains('Bäckerei').should('be.visible');
  });

  it('should filter items when searching', () => {
    cy.get('button[title="Suchen"]').click();
    cy.get('input[placeholder="Items suchen…"]').type('Milch');
    cy.contains('Milch').should('be.visible');
    cy.contains('Brot').should('not.exist');
  });

  it('should show all items again when search is cleared', () => {
    cy.get('button[title="Suchen"]').click();
    cy.get('input[placeholder="Items suchen…"]').type('Milch');
    cy.contains('Brot').should('not.exist');
    cy.get('input[placeholder="Items suchen…"]').clear();
    cy.contains('Brot').should('be.visible');
  });

  it('should show empty result for non-matching search term', () => {
    cy.get('button[title="Suchen"]').click();
    cy.get('input[placeholder="Items suchen…"]').type('Banane');
    cy.contains('Milch').should('not.exist');
    cy.contains('Brot').should('not.exist');
  });
});