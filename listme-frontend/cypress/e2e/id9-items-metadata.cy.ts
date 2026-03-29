describe('ID 9: Items Metadata (Quantity, Units, Labels)', () => {
    const listId = '1';

    beforeEach(() => {
        cy.intercept('GET', `**/api/v1/lists/${listId}/items`, {
            statusCode: 200,
            body: [
                {
                    id: '101',
                    name: 'Äpfel',
                    checked: false,
                    quantity: 2,
                    quantityUnit: 'kg',
                    labels: [{ id: 'l1', name: 'Bio', color: '#00ff00' }]
                }
            ]
        }).as('getItems');

        cy.visit(`/list/${listId}`);
        cy.wait('@getItems');
    });

    it('should display quantity and unit', () => {
        cy.contains('2 kg').should('be.visible');
    });

    it('should display labels', () => {
        cy.contains('Bio').should('be.visible');
    });

    it('should allow adding metadata when creating an item', () => {
        cy.intercept('POST', `**/api/v1/lists/${listId}/items`, {
            statusCode: 201,
            body: { id: '102', name: 'Milch', quantity: 3, quantityUnit: 'l' }
        }).as('createItem');

        // Open add item FAB
        cy.get('button').filter(':has(svg:has(path[d*="M12 4v16m8-8H4"]))').click();

        cy.get('input[placeholder="Was kaufst du?"]').type('Milch');

        cy.get('input[type="number"]').type('3');

        cy.contains('button', 'Hinzufügen').click();
        cy.wait('@createItem');
    });
});
