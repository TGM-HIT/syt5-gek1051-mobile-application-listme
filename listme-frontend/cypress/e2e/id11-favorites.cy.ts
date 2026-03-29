describe('ID 11: Favorite Items', () => {
    const listId = '1';

    beforeEach(() => {
        // Intercept lists and library (where favorites might be located)
        cy.intercept('GET', '**/api/v1/lists', {
            statusCode: 200,
            body: [{ id: listId, name: 'Shopping List', emoji: '🛒', itemCount: 0, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString() }]
        });

        // Visiting the library where favorites are usually stored/managed
        cy.visit('/library');
    });

    it('should display favorite items in the library', () => {
        // Mocking favorite presets/items
        cy.intercept('GET', '**/api/v1/presets', {
            statusCode: 200,
            body: [
                { id: 'p1', name: 'Milch', emoji: '🥛', itemCount: 1 }
            ]
        });

        cy.visit('/library');
        cy.contains('Milch').should('be.visible');
    });

    it('should allow adding a favorite to the current list', () => {
        // Navigate via BottomNav to library
        cy.visit('/');
        cy.contains('Bibliothek').parent().click();
        cy.url().should('include', '/library');

        // Select a preset/favorite to create a list from it or add to it
        // Based on HomeView.vue, coming from Library opens AddListModal with preset
        cy.contains('Milch').click();
        cy.url().should('include', '/?presetId=p1');
        cy.get('input[placeholder="Name der Liste…"]').should('have.value', 'Milch');
    });
});
describe('ID 11: Favorite Items', () => {
    const listId = '1';

    beforeEach(() => {
        // Intercept lists and library (where favorites might be located)
        cy.intercept('GET', '**/api/v1/lists', {
            statusCode: 200,
            body: [{ id: listId, name: 'Shopping List', emoji: '🛒', itemCount: 0, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString() }]
        });

        // Visiting the library where favorites are usually stored/managed
        cy.visit('/library');
    });

    it('should display favorite items in the library', () => {
        // Mocking favorite presets/items
        cy.intercept('GET', '**/api/v1/presets', {
            statusCode: 200,
            body: [
                { id: 'p1', name: 'Milch', emoji: '🥛', itemCount: 1 }
            ]
        });

        cy.visit('/library');
        cy.contains('Milch').should('be.visible');
    });

    it('should allow adding a favorite to the current list', () => {
        // Navigate via BottomNav to library
        cy.visit('/');
        cy.contains('Bibliothek').parent().click();
        cy.url().should('include', '/library');

        // Select a preset/favorite to create a list from it or add to it
        // Based on HomeView.vue, coming from Library opens AddListModal with preset
        cy.contains('Milch').click();
        cy.url().should('include', '/?presetId=p1');
        cy.get('input[placeholder="Name der Liste…"]').should('have.value', 'Milch');
    });
});
