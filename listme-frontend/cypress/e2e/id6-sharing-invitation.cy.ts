describe('ID 6: Sharing via Invitation Code', () => {
  const listId = '1';
  const shareToken = 'Xk9mP2';

  beforeEach(() => {
    cy.intercept('GET', '**/api/lists', {
      statusCode: 200,
      body: [{ id: listId, name: 'Shared List', emoji: '🛒', itemCount: 0, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString(), shareToken: null }]
    });
    cy.intercept('GET', `**/api/lists/${listId}/items`, {
      statusCode: 200,
      body: []
    });
  });

  it('should open sharing modal when share button is clicked', () => {
    cy.intercept('POST', `**/api/lists/${listId}/share`, {
      statusCode: 200,
      body: { token: shareToken }
    }).as('generateToken');

    cy.visit(`/list/${listId}`);
    cy.get('button[aria-label="Liste teilen"]').click();
    cy.wait('@generateToken');
    cy.contains('Liste teilen').should('be.visible');
  });

  it('should display share link in modal', () => {
    cy.intercept('POST', `**/api/lists/${listId}/share`, {
      statusCode: 200,
      body: { token: shareToken }
    }).as('generateToken');

    cy.visit(`/list/${listId}`);
    cy.get('button[aria-label="Liste teilen"]').click();
    cy.wait('@generateToken');
    cy.contains(`/s/${shareToken}`).should('be.visible');
  });

  it('should show join prompt when visiting a share link', () => {
    cy.intercept('GET', `**/api/share/${shareToken}`, {
      statusCode: 200,
      body: { id: listId, name: 'Freigegebene Liste', emoji: '🤝', itemCount: 3, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString() }
    }).as('previewToken');

    cy.visit(`/s/${shareToken}`);
    cy.wait('@previewToken');
    cy.contains('Du wurdest zu dieser Liste eingeladen').should('be.visible');
    cy.contains('Freigegebene Liste').should('be.visible');
  });

  it('should join a list via share token and redirect to list detail', () => {
    cy.intercept('GET', `**/api/share/${shareToken}`, {
      statusCode: 200,
      body: { id: listId, name: 'Freigegebene Liste', emoji: '🤝', itemCount: 3, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString() }
    }).as('previewToken');

    cy.intercept('POST', `**/api/share/${shareToken}/join`, {
      statusCode: 200,
      body: { id: '2', name: 'Freigegebene Liste', emoji: '🤝', itemCount: 3, checkedCount: 0, participantCount: 2, updatedAt: new Date().toISOString() }
    }).as('joinList');

    cy.intercept('GET', '**/api/lists/2/items', { statusCode: 200, body: [] });

    cy.visit(`/s/${shareToken}`);
    cy.wait('@previewToken');
    cy.contains('Dieser Liste beitreten').click();
    cy.wait('@joinList');
    cy.url().should('include', '/list/2');
  });

  it('should show error when share token is invalid', () => {
    const invalidToken = 'invalid-token';
    cy.intercept('GET', `**/api/share/${invalidToken}`, {
      statusCode: 404,
      body: {}
    }).as('previewInvalid');

    cy.visit(`/s/${invalidToken}`);
    cy.wait('@previewInvalid');
    cy.get('body').should('not.be.empty');
  });
});