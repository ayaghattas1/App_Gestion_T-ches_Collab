describe('Project Page - Add Project', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    // Perform login before each test
    cy.visit('http://localhost:3000/login');
    cy.get('input#email').type('rahma@gmail.com');
    cy.get('input#auth-login-password').type('123');
    cy.contains('button', 'Sign In').click();

    // Wait for the login request to complete
    cy.intercept('POST', '/api/auth/callback/credentials').as('loginRequest');
    cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);

    // Verify the URL change to dashboard
    cy.url().should('eq', 'http://localhost:3000/dashboard');
    cy.wait(700);

    // Intercept the GET request for projects
    cy.intercept('GET', 'http://localhost:5000/projects').as('getProjects');

    // Visit the project page
    cy.visit('http://localhost:3000/MyProjects');
    cy.wait(700);

    // Wait for the projects to be loaded
    cy.wait('@getProjects').its('response.statusCode').should('be.oneOf', [200, 304]);
  });

  it('should open the Add Project modal and close it using the Cancel button', () => {
    cy.contains('+ Add Project').click();

    cy.contains('Add Project').should('be.visible');
    cy.wait(500);

    cy.contains('button', 'Cancel').click();
    cy.wait(500);
    cy.contains('+ Add Project').should('be.visible');
    cy.contains('button', 'Cancel').should('not.exist');
  });


  it('should open add a project by filling the form', () => {
    cy.contains('+ Add Project').click();

    cy.contains('Add Project').should('be.visible');

    cy.get('input[placeholder="Project Name"]').type('New Project');

    cy.get('div[id^="react-select"]').eq(1).click({ force: true });
    cy.get('div[id^="react-select"]').eq(2).contains('Kanban').click({ force: true });
    cy.wait(1000);
    cy.get('div[id^="react-select"]').eq(1).click({ force: true });
    cy.get('div[id^="react-select"]').eq(2).contains('Done').click({ force: true });


    cy.get('input[placeholder="Completion"]').clear().type('50');

    cy.contains('button', 'Save').click();
    cy.wait(200);
    cy.window().then((win) => {
      win.scrollTo(0, 0);
    });
    cy.contains('Project added successfully!').should('be.visible');


  });
});
