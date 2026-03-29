describe('ID 12: Remove Participants', () => {
    const listId = '1';

    beforeEach(() => {
        cy.intercept('GET', '**/api/v1/lists', {
            statusCode: 200,
            body: [{ id: listId, name: 'Shared List', emoji: '🛒', itemCount: 0, checkedCount: 0, participantCount: 2, updatedAt: new Date().toISOString() }]
        });
        cy.intercept('GET', `**/api/v1/lists/${listId}/items`, {
            statusCode: 200,
            body: []
        });

        // Mock participant info
        cy.intercept('GET', `**/api/v1/lists/${listId}/participants`, {
            statusCode: 200,
            body: [
                { id: 'u1', name: 'Ich', isMe: true },
                { id: 'u2', name: 'Andere Person', isMe: false }
            ]
        }).as('getParticipants');

        cy.visit(`/list/${listId}`);
        cy.wait('@getParticipants');
    });

    it('should show the participant list and allow removal', () => {
        // Participant avatars/list trigger
        cy.get('button[aria-label*="Teilnehmer"]').click();
        cy.contains('Andere Person').should('be.visible');

        // We expect a remove button for non-me participants
        // Based on ParticipantSheet.vue
        cy.contains('button', 'Entfernen').should('exist');
    });
});
