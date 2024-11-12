const jwt = require("jsonwebtoken")
const User = require("../models/user")
const Project = require("../models/project")



module.exports.loggedMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, "RANDOM_TOKEN_SECRET");
    const userId = decodedToken.userId;

    User.findOne({ _id: userId })
    .then((user) => {
       if (!user) {
          return res.status(401).json({ message: "login ou mot de passe incorrecte " });
       } else {
          req.auth = {
             userId: userId,
             role: user.role,
          };
          next();
       }
    })
    .catch((error) => {
       res.status(500).json({ error: error.message });
    });
 
  } catch (error) {
    res.status(401).json({ error });
  }
};
  
module.exports.isManager = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.auth.userId;

    // Récupère le projet
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Projet non trouvé." });
    }

    // Vérifie le rôle de l'utilisateur dans le projet
    const userRoleInProject = project.membres.find(member => member.utilisateur.equals(userId));
    if (!userRoleInProject ||  userRoleInProject.role !== "Manager"  ) {
      return res.status(403).json({ error: "Vous n'avez pas les autorisations requises pour cette action. Il faut etre le manager de ce projet" });
    }

    // Si l'utilisateur a le rôle de manager, passe à la prochaine étape du middleware
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
