describe('ID 10: Item Images', () => {
    const listId = '1';

    beforeEach(() => {
        cy.intercept('GET', `**/api/v1/lists/${listId}/items`, {
            statusCode: 200,
            body: [
                {
                    id: '101',
                    name: 'Äpfel',
                    checked: false,
                    imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
                }
            ]
        }).as('getItems');

        cy.visit(`/list/${listId}`);
        cy.wait('@getItems');
    });

    it('should display the item thumbnail if an image exists', () => {
        cy.get('img[alt="Äpfel"]').should('be.visible');
    });

    it('should allow attaching an image (simulated upload)', () => {
        // FAB for adding items
        cy.get('button').filter(':has(svg:has(path[d*="M12 4v16m8-8H4"]))').click();

        // Check if an image upload or camera button exists in AddItemSheet.vue
        // We search for typical file inputs or buttons with camera icons
        cy.get('input[type="file"]').should('exist');
    });
});
