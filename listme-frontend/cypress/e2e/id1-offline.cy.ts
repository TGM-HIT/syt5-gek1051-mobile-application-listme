describe('ID 1: Offline Access', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/lists', {
      statusCode: 200,
      body: []
    }).as('getLists');
    cy.visit('/');
  });

  it('should show offline banner when connection is lost', () => {
    cy.window().then((win) => {
      const event = new Event('offline');
      win.dispatchEvent(event);
    });
    cy.contains('Kein Internet — Offline-Daten werden angezeigt').should('be.visible');
  });

  it('should show back online banner when connection returns', () => {
    // Start offline
    cy.window().then((win) => {
      win.dispatchEvent(new Event('offline'));
    });
    
    // Switch to online
    cy.window().then((win) => {
      const event = new Event('online');
      win.dispatchEvent(event);
    });
    cy.contains('Wieder online — Listen werden aktualisiert').should('be.visible');
  });
});
