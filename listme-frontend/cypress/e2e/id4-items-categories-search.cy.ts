describe('ID 4: Items with Categories and Search', () => {
  const listId = '1';

  beforeEach(() => {
    cy.intercept('GET', `**/api/v1/lists/${listId}/items`, {
      statusCode: 200,
      body: [
        { id: '101', name: 'Milch', checked: false, categoryName: 'Molkerei', categoryColor: '#ffffff' },
        { id: '102', name: 'Brot', checked: false, categoryName: 'Bäckerei', categoryColor: '#eeeeee' }
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

  it('should search for items within a list', () => {
    cy.get('button[title="Suchen"]').click();
    cy.get('input[placeholder="Items suchen…"]').type('Milch');
    
    cy.contains('Milch').should('be.visible');
    cy.contains('Brot').should('not.exist');
  });
});
