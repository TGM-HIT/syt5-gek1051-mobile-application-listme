describe('ID 7: Real-time Sync', () => {
  const listId = '1';

  beforeEach(() => {
    cy.intercept('GET', '**/api/lists', {
      statusCode: 200,
      body: [{ id: listId, name: 'Sync List', emoji: '🛒', itemCount: 1, checkedCount: 0, participantCount: 2, updatedAt: new Date().toISOString() }]
    });
    cy.intercept('GET', `**/api/lists/${listId}/items`, {
      statusCode: 200,
      body: [{ id: '101', name: 'Milch', checked: false, quantity: null, quantityUnit: null, price: null, imageUrl: null, labels: [] }]
    });
    cy.intercept('GET', '**/api/favorites', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/api/lists/*/budget', { statusCode: 200, body: { total: 0, byCategory: {} } });
    cy.intercept('GET', `**/api/lists/${listId}/participants`, {
      statusCode: 200,
      body: [
        { deviceId: 'device-1', role: 'owner', displayName: 'Alice' },
        { deviceId: 'device-2', role: 'member', displayName: 'Bob' }
      ]
    }).as('getParticipants');
    cy.visit(`/list/${listId}`);
  });

  it('should show connection status banner when WebSocket is connecting', () => {
    // ConnectionBanner shows when not connected — initially 'Verbindung wird hergestellt…'
    cy.contains(/Verbindung wird hergestellt|Verbunden/).should('exist');
  });

  it('should display multiple participants when list is shared', () => {
    cy.wait('@getParticipants');
    // ParticipantList shows when participants.length > 1
    cy.contains('2 Teilnehmer').should('be.visible');
  });

  it('should show participant avatars in the list header', () => {
    cy.wait('@getParticipants');
    // Avatar buttons render participant initials
    cy.contains('AL').should('be.visible'); // Alice → AL
  });

  it('should show offline banner when network goes offline', () => {
    cy.window().then((win) => {
      win.dispatchEvent(new Event('offline'));
    });
    cy.contains('Kein Internet — Offline gespeichert').should('be.visible');
  });
});