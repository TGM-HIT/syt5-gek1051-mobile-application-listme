describe('Initial Test', () => {
  it('should load the home page', () => {
    cy.visit('/');
    cy.contains('h1', 'ListMe').should('be.visible');
    cy.get('img[alt="ListMe"]').should('be.visible');
  });
});
