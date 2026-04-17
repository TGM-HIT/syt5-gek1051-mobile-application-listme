describe('ID 12: Sharing Participants', () => {
  const listId = '1';
  const participants = [
    { deviceId: 'device-aaaaaa', role: 'owner', displayName: 'Alice Muster', profilePicture: null },
    { deviceId: 'device-bbbbbb', role: 'member', displayName: 'Bob Beispiel', profilePicture: null }
  ];

  beforeEach(() => {
    cy.intercept('GET', '**/api/lists', {
      statusCode: 200,
      body: [{ id: listId, name: 'Geteilte Liste', emoji: '🤝', itemCount: 1, checkedCount: 0, participantCount: 2, updatedAt: new Date().toISOString() }]
    });
    cy.intercept('GET', `**/api/lists/${listId}/items`, {
      statusCode: 200,
      body: [{ id: '101', name: 'Milch', checked: false, quantity: null, quantityUnit: null, price: null, imageUrl: null, labels: [], createdByDeviceId: 'device-bbbbbb' }]
    }).as('getItems');
    cy.intercept('GET', '**/api/favorites', { statusCode: 200, body: [] });
    cy.intercept('GET', `**/api/lists/${listId}/participants`, {
      statusCode: 200,
      body: participants
    }).as('getParticipants');
    cy.intercept('GET', '**/api/lists/*/budget', { statusCode: 200, body: { total: 0, byCategory: {} } });
    cy.visit(`/list/${listId}`);
    cy.wait('@getItems');
  });

  it('should display participant count when list has multiple participants', () => {
    cy.wait('@getParticipants');
    cy.contains('2 Teilnehmer').should('be.visible');
  });

  it('should show participant avatars with correct initials', () => {
    cy.wait('@getParticipants');
    // Alice Muster → AM, Bob Beispiel → BB
    cy.contains('AM').should('be.visible');
    cy.contains('BB').should('be.visible');
  });

  it('should open participant detail sheet when avatar is clicked', () => {
    cy.wait('@getParticipants');
    cy.contains('BB').click();
    // ParticipantSheet should open showing Bob's info
    cy.contains('Bob Beispiel').should('be.visible');
    cy.contains('Teilnehmer').should('be.visible');
  });

  it('should show items added by participant in detail sheet', () => {
    cy.wait('@getParticipants');
    cy.contains('BB').click();
    // Bob added "Milch"
    cy.contains('Hinzugefügte Artikel').should('be.visible');
    cy.contains('Milch').should('be.visible');
  });

  it('should close participant sheet when backdrop is clicked', () => {
    cy.wait('@getParticipants');
    cy.contains('BB').click();
    cy.contains('Bob Beispiel').should('be.visible');
    // Click backdrop to close
    cy.get('.absolute.inset-0.bg-ctp-crust\\/60').click({ force: true });
    cy.contains('Bob Beispiel').should('not.exist');
  });

  it('should show owner role label in participant sheet', () => {
    cy.wait('@getParticipants');
    cy.contains('AM').click();
    cy.contains('Ersteller').should('be.visible');
  });
});