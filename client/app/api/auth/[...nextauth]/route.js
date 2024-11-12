// import NextAuth from "next-auth/next";
// import CredentialsProvider from "next-auth/providers/credentials";
// import axios from "axios";

// export const authOptions = {
//   providers: [
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {},
    

//       async authorize(credentials) {
//         try {
//             const response = await axios.post(`http://localhost:5000/login`, {
//                 email: credentials.email,
//                 password: credentials.password,
//               });
//               if (response.status === 200) {
//                 const user = {
//                   email: credentials.email, 
//                   firstname: response.data.firstname, 
//                   role: response.data.role,
//                   accessToken: response.data.token,
//                 };
//                 console.log("Authentication successful. Server response:", response.data);
//                 return user;
//               } else {
//                 console.log("Authentication failed. Server response:", response.data);
//                 return null;
//               }
//         } catch (error) {
//           console.log("Error during authentication:", error);

//         }
//       },
//     }),
//   ],
//   session: {
//     strategy: "jwt",
//   },
//   secret: process.env.NEXT_AUTH_SECRET,
//   pages: {
//     signIn: "/",
//   },
// };

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };

import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials) {
        try {
          const response = await axios.post(`http://localhost:5000/login`, {
            email: credentials.email,
            password: credentials.password,
          });
          if (response.status === 200) {
            const user = {
              email: credentials.email,
              _id: response.data._id,
              firstname: response.data.firstname,
              lastname: response.data.lastname,
              photo: response.data.photo,
              descriptionprofile: response.data.descriptionprofile,
              projects:  response.data.projects,
              accessToken: response.data.token,
              notifications: response.data.notifications,
              
            };
            console.log("Authentication successful. Server response:", response.data);
            return user;
          } else {
            console.log("Authentication failed. Server response:", response.data);
            return null;
          }
        } catch (error) {
          console.log("Error during authentication:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      // user is defined when the user is logging in for the first time
      if (user) {
        token.accessToken = user.accessToken; // Store the token into the JWT
        token.user = user; 
        token.projects = user.projects || [];
        token.notifications = user.notifications || [];
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user = token.user;
      session.accessToken = token.accessToken; // Provide the token to the client-side session
      maxAge: 24 * 60 * 60;
      session.user = {
        ...session.user,
        projects: token.projects || [],
        notifications: token.notifications || [],
      };
      return session;

    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Every day
  },
  secret: process.env.NEXT_AUTH_SECRET,
  pages: {
    signIn: "/",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
