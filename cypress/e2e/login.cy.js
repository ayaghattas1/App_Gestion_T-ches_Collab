describe('Login Page', () => {
  beforeEach(() => {
    cy.clearCookies();
  cy.clearLocalStorage();
    cy.visit('http://localhost:3000/login'); 
  });

  it('should display the login form', () => {
    cy.get('form').should('be.visible');
    cy.get('input#email').should('be.visible');
    cy.get('input#auth-login-password').should('be.visible');
    cy.contains('button', 'Sign In').should('be.visible');
  });

  it('should allow the user to toggle password visibility', () => {
    cy.get('input#auth-login-password').type('wrongpassword');
    cy.get('input#auth-login-password').should('have.attr', 'type', 'password');
    cy.get('[aria-label="toggle password visibility"]').should('be.visible').trigger('mousedown');
    cy.get('[aria-label="toggle password visibility"]').click();
    cy.get('input#auth-login-password').should('have.attr', 'type', 'text');
    cy.get('[aria-label="toggle password visibility"]').should('be.visible').trigger('mouseup');
    cy.get('[aria-label="toggle password visibility"]').click();
    cy.wait(500); 
    cy.get('input#auth-login-password').should('have.attr', 'type', 'password');
  });

  it('should show an error message with invalid credentials', () => {
    cy.get('input#email').type('rahma@gmail.com');
    cy.get('input#auth-login-password').type('wrongpassword');
    cy.contains('button', 'Sign In').click();
    cy.contains('Invalid Credentials.').should('be.visible');
  });

  it('should redirect to the dashboard on successful login', () => {
    cy.intercept('POST', '/api/auth/callback/credentials').as('loginRequest');

    cy.get('input#email').type('rahma@gmail.com');
    cy.get('input#auth-login-password').type('123');
    cy.contains('button', 'Sign In').click();

    // Wait for login request to complete
    cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
    
    // Verify the URL change to dashboard
    cy.url().should('eq', 'http://localhost:3000/dashboard');
  });
});
