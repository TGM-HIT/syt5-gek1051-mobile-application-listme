// ConnectionBanner is rendered in ListDetailView — offline tests run on /list/:id
describe('ID 1: Offline Access', () => {
  const listId = '1';

  beforeEach(() => {
    cy.intercept('GET', '**/api/lists', {
      statusCode: 200,
      body: [{ id: listId, name: 'Test', emoji: '🛒', itemCount: 0, checkedCount: 0, participantCount: 1, updatedAt: new Date().toISOString() }]
    }).as('getLists');
    cy.intercept('GET', `**/api/lists/${listId}/items`, { statusCode: 200, body: [] }).as('getItems');
    cy.intercept('GET', '**/api/lists/*/budget', { statusCode: 200, body: { total: 0, byCategory: {} } });
    cy.visit(`/list/${listId}`);
    cy.wait('@getItems');
  });

  it('should show offline banner when connection is lost', () => {
    cy.window().then((win) => {
      win.dispatchEvent(new Event('offline'));
    });
    cy.contains('Kein Internet — Offline gespeichert').should('be.visible');
  });

  it('should hide offline banner and show reconnecting state when network returns', () => {
    cy.window().then((win) => {
      win.dispatchEvent(new Event('offline'));
    });
    cy.contains('Kein Internet — Offline gespeichert').should('be.visible');

    cy.window().then((win) => {
      win.dispatchEvent(new Event('online'));
    });
    // After going back online the offline message disappears;
    // without a live WebSocket the banner transitions to 'syncing' state
    cy.contains('Kein Internet — Offline gespeichert').should('not.exist');
    // Banner transitions to a connecting/reconnecting state (exact text depends
    // on whether the WS has already attempted a reconnect in this test run)
    cy.contains(/Verbindung wird hergestellt|Erneut verbinden/).should('be.visible');
  });

  it('should still display list items while offline', () => {
    cy.intercept('GET', `**/api/lists/${listId}/items`, {
      statusCode: 200,
      body: [{ id: '101', name: 'Milch', checked: false }]
    }).as('getItemsLoaded');
    cy.visit(`/list/${listId}`);
    cy.wait('@getItemsLoaded');

    cy.window().then((win) => {
      win.dispatchEvent(new Event('offline'));
    });
    cy.contains('Kein Internet — Offline gespeichert').should('be.visible');
    // Previously loaded items remain visible
    cy.contains('Milch').should('be.visible');
  });
});