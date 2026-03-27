describe('ID 6: Sharing via Invitation Code', () => {
  const listId = '1';

  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/lists', {
      statusCode: 200,
      body: [{ id: listId, name: 'Shared List', emoji: '🛒', itemCount: 0, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString() }]
    });
    cy.intercept('GET', `**/api/v1/lists/${listId}/items`, {
      statusCode: 200,
      body: []
    });
    cy.visit(`/list/${listId}`);
  });

  it('should show the sharing modal with a token', () => {
    cy.get('button[aria-label="Liste teilen"]').click();
    cy.contains('Einkaufsliste teilen').should('be.visible');
    
    // The modal should contain a share link or token (depending on implementation in ShareListModal)
    // We expect some input field with the link
    cy.get('input').should('exist');
  });

  it('should join a list via token URL', () => {
    const token = 'abc-123';
    cy.intercept('POST', `**/api/v1/lists/join/${token}`, {
      statusCode: 200,
      body: { id: '2', name: 'Joined List', emoji: '🤝' }
    }).as('joinList');

    cy.visit(`/s/${token}`);
    cy.contains('Du wurdest eingeladen').should('be.visible');
    cy.contains('Liste beitreten').click();
    cy.wait('@joinList');
    cy.url().should('include', '/list/2');
  });
});
