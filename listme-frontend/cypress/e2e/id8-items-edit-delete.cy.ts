describe('ID 8: Item Editing and Deletion', () => {
    const listId = '1';
    const item = { id: '101', name: 'Milch', checked: false };

    beforeEach(() => {
        cy.intercept('GET', `**/api/v1/lists/${listId}/items`, {
            statusCode: 200,
            body: [item]
        }).as('getItems');

        cy.intercept('PUT', `**/api/v1/lists/${listId}/items/${item.id}`, {
            statusCode: 200,
            body: { ...item, name: 'Frischmilch' }
        }).as('updateItem');

        cy.intercept('DELETE', `**/api/v1/lists/${listId}/items/${item.id}`, {
            statusCode: 204
        }).as('deleteItem');

        cy.visit(`/list/${listId}`);
        cy.wait('@getItems');
    });

    it('should edit an existing item name', () => {
        // The edit button is in the ItemRow, hidden until hover
        cy.get('button').filter(':has(svg:has(path[d*="M15.232"]))').first().click({ force: true });

        // In AddItemSheet (as edit modal)
        cy.get('input[placeholder="Was kaufst du?"]').clear().type('Frischmilch');
        cy.contains('button', 'Speichern').click();

        cy.wait('@updateItem');
        cy.get('@updateItem').its('request.body').should('include', { name: 'Frischmilch' });
    });

    it('should delete an item from the list', () => {
        // The delete button is in the ItemRow, hidden until hover
        cy.get('button').filter(':has(svg:has(path[d*="M19 7l-.867"]))').last().click({ force: true });
        cy.wait('@deleteItem');
    });
});
