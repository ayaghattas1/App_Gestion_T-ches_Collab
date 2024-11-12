describe('Registration Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/register'); 
  });

  it('should display the registration form', () => {
    cy.get('form').should('be.visible');
    cy.get('input#firstname').should('be.visible');
    cy.get('input#lastname').should('be.visible');
    cy.get('input#email').should('be.visible');
    cy.get('input#auth-login-password').should('be.visible');
    cy.get('input#confirm-password').should('be.visible');
    cy.contains('button', 'Create Account').should('be.visible');
  });

  it('should display an error for missing fields', () => {
    cy.get('input#firstname').type('John');
    cy.get('input#lastname').type('Doe');
    cy.get('button[type="submit"]').click();
    cy.contains('All fields are necessary.').should('be.visible');
  });

  it('should display an error for invalid email format', () => {
    cy.get('input#firstname').type('John');
    cy.get('input#lastname').type('Doe');
    cy.get('input#email').type('john.doe.com');
    cy.get('input#auth-login-password').type('password123');
    cy.get('input#confirm-password').type('password123');
    cy.get('button[type="submit"]').click();
    
    cy.get('input#email:invalid').should('have.length', 1); // Check if the email input is invalid
  });

  it('should display an error for passwords less than 5 characters', () => {
    cy.get('input#firstname').type('John');
    cy.get('input#lastname').type('Doe');
    cy.get('input#email').type('john.doe@example.com');
    cy.get('input#auth-login-password').type('1234');
    cy.get('input#confirm-password').type('1234');
    cy.get('button[type="submit"]').click();
    cy.contains('Password must be at least 5 characters long.').should('be.visible');
  });

  it('should display an error for mismatched passwords dynamically', () => {
    cy.get('input#firstname').type('John');
    cy.get('input#lastname').type('Doe');
    cy.get('input#email').type('john.doe@example.com');
    cy.get('input#auth-login-password').type('password123');
    cy.get('input#confirm-password').type('password');
    
    // Ensure the real-time error message for mismatched passwords appears as user types
    cy.contains('Passwords do not match').should('be.visible');

    // Complete the input and check if the error message persists
    cy.get('input#confirm-password').clear().type('password456');
    cy.contains('Passwords do not match').should('be.visible');
  });

  it('should display an error if the user already exists', () => {
    // Mocking the API response for an existing user
    cy.intercept('POST', '/api/register', {
      statusCode: 400,
      body: { user: 'User already registered' },
    }).as('registerRequest');

    cy.get('input#firstname').type('InesAya');
    cy.get('input#lastname').type('InesAya');
    cy.get('input#email').type('InesAya@gmail.com');
    cy.get('input#auth-login-password').type('password123');
    cy.get('input#confirm-password').type('password123');
    cy.get('button[type="submit"]').click();

    // Wait for the register request to complete and verify error message
    cy.wait('@registerRequest');
    cy.contains('User registration failed: User already registered').should('be.visible');
  });

  it('should redirect to login page on successful registration', () => {
    cy.intercept('POST', '/api/register', { statusCode: 200 }).as('registerRequest');

    cy.get('input#firstname').type('tachety');
    cy.get('input#lastname').type('tachety');
    cy.get('input#email').type('tachety@gmail.com');
    cy.get('input#auth-login-password').type('password123');
    cy.get('input#confirm-password').type('password123');
    cy.get('button[type="submit"]').click();

    // Wait for the register request to complete and verify redirection
    cy.wait('@registerRequest').its('response.statusCode').should('eq', 200);
    cy.url().should('eq', 'http://localhost:3000/login');
  });
});
