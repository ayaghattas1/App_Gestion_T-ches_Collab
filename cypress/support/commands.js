// Cypress.Commands.add('login', (email, password) => {
//     cy.request({
//       method: 'POST',
//       url: 'http://localhost:5000/login', // Update this URL to your login endpoint
//       body: {
//         email,
//         password
//       }
//     }).then((resp) => {
//       // assuming the response contains the token
//       const projects = JSON.stringify(resp.body.projects); // Convert projects array to a JSON string
//       window.localStorage.setItem('token', resp.body.token);
//       window.localStorage.setItem('projects', projects);
  
//       cy.setCookie('authToken', resp.body.token); // Set a cookie if your app uses cookies
//       cy.setCookie('projects', projects); // Set projects cookie with stringified JSON
//     });
//   });
  