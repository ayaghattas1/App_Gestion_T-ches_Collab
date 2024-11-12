const Project = require("../models/project");
const moment = require('moment-timezone');
const User = require("../models/user");
const { populate } = require("dotenv");

const addNotification = async (userId, message) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: { notifications: { message } }
    });
  } catch (error) {
    console.error('Error adding notification:', error);
  }
};

const addProject = async (req, res, next) => {
    try {
      const projectData = req.body;
      const userId = req.auth.userId;
      const user = await User.findById(userId);
      if(!user){
        return res.status(400).json({
          message: "Utilisateur non touvé"})
      };
      projectData.createdAt = moment().tz('Europe/Paris').toDate();
  
      const newProject= new Project(projectData);
      newProject.membres.push({
        utilisateur: userId,
        role: "Manager",
    });
    await addNotification(userId, `You have been added to a new project : ${ newProject.nom }`);
    user.projects.push(newProject._id); 
        await user.save();
      newProject.save()
        .then(projet => {
          res.json(projet);
        })
        .catch(err => {
          console.error('Erreur lors de la création du projet :', err);
          res.status(400).json({ erreur: 'Échec de la création du projet', message: err.message });
        });
    } catch (error) {
      console.error('Erreur lors de la création du projet :', error);
      res.status(500).json({ erreur: 'Erreur lors de la création du projet', message: error.message });
    }
  };

  const fetchProject = (req, res) => {
    Project.findOne({ _id: req.params.id })
    .populate('membres.utilisateur')
    .then((project) => {
      if (!project) {
        res.status(404).json({
          message: "objet non trouvé!",
        });
      } else {
        res.status(200).json({
          model: project,
          message: "objet trouvé!",
        });
      }
    })
    .catch(() => {
      res.status(400).json({
        error: Error.message,
        message: "Données invalides!",
      });
    });
}

  const getProject = (req, res) => {
    Project.find().then((projects) => {
      res.status(200).json({
        model: projects,
        message: "success"
      });
    })
    .catch((error) => {
      res.status(500).json({
        error: error.message,
        message: "problème d'extraction"
      });
    });
  };

  const updateProject = (req, res) => {
    Project.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true }).then(
        (project) => {
          if (!project) {
            res.status(404).json({
              message: "objet non trouvé!",
            });
          } else {
            res.status(200).json({
              model: project,
              message: "objet modifié!",
            });
          }
        }
      )
}
const deleteProject = (req, res) => {
    Project.deleteOne({ _id: req.params.projectId })
      .then((result) => {
        if (result.deletedCount === 0) {
          res.status(404).json({
            message: "Projet non trouvé !",
          });
        } else {
          res.status(200).json({
            model: result,
            message: "Projet supprimé!",
          });
        }
      })
      .catch((error) => {
        res.status(400).json({
          error: error.message,
          message: "Données invalides!",
        });
      });
  };

// const inviteUserToProject = async (req, res, next) => {
//   try {
//     const { projectId} = req.params;
//     const { email, role } = req.body;

//         // Vérifier si l'utilisateur existe avec cet email
//         const invitedUser = await User.findOne({ email });

//         if (!invitedUser) {
//             return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet email" });
//         }

//         const project = await Project.findById(projectId);

//         if (!project) {
//             return res.status(404).json({ message: "Projet non trouvé" });
//         }

//         // Vérifier si l'utilisateur est déjà membre du projet
//         const isMember = project.membres.some(member => member.utilisateur.equals(invitedUser._id));
//         if (isMember) {
//             return res.status(400).json({ message: "Cet utilisateur est déjà membre du projet" });
//         }

//         // Ajouter l'utilisateur en tant que membre avec le rôle spécifié
//         project.membres.push({ utilisateur: invitedUser._id, role });
//         invitedUser.projects.push(project._id);
//         await invitedUser.save();
//         await project.save();

//         res.json({ message: "Utilisateur invité avec succès au projet" });
//     } catch (error) {
//         console.error("Erreur lors de l'invitation de l'utilisateur au projet :", error);
//         res.status(500).json({ error: "Erreur lors de l'invitation de l'utilisateur au projet", message: error.message });
//     }
// };
const inviteUserToProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;

    // Vérifier si l'utilisateur existe avec cet ID
    const invitedUser = await User.findById(userId);

    if (!invitedUser) {
        return res.status(404).json({ message: "Aucun utilisateur trouvé avec cet ID" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
        return res.status(404).json({ message: "Projet non trouvé" });
    }

    // Vérifier si l'utilisateur est déjà membre du projet
    const isMember = project.membres.some(member => member.utilisateur.equals(invitedUser._id));
    if (isMember) {
        return res.status(400).json({ message: "Cet utilisateur est déjà membre du projet" });
    }

    // Ajouter l'utilisateur en tant que membre avec le rôle spécifié
    project.membres.push({ utilisateur: invitedUser._id, role });
    invitedUser.projects.push(project._id);
    await invitedUser.save();
    await project.save();
    await addNotification(userId, 'You have been added to a new project.');
    res.json({ message: "Utilisateur invité avec succès au projet" });
  } catch (error) {
    console.error("Erreur lors de l'invitation de l'utilisateur au projet :", error);
    res.status(500).json({ error: "Erreur lors de l'invitation de l'utilisateur au projet", message: error.message });
  }
};


const removeMemberFromProject = async (req, res) => {
  try {
      const { projectId, memberId } = req.params;

      // Recherche le projet par ID
      const project = await Project.findById(projectId);
      if (!project) {
          console.error("Projet non trouvé.");
          return res.status(404).json({ erreur: "Projet non trouvé." });
      }

      // Vérifie si le membre à supprimer est associé au projet
      const memberIndex = project.membres.findIndex(member => member.utilisateur.toString() === memberId);
      if (memberIndex === -1) {
          console.error("Membre non trouvé dans le projet.");
          return res.status(404).json({ erreur: "Membre non trouvé dans le projet." });
      }

      // Supprime le membre du tableau des membres
      project.membres.splice(memberIndex, 1);

      // Enregistre les modifications apportées au projet
      await project.save();
      await addNotification(memberId, 'You have been deleted from a the project.', project.nom);
      res.json({ message: "Membre supprimé avec succès du projet." });
  } catch (error) {
      console.error('Erreur lors de la suppression du membre du projet :', error);
      res.status(500).json({ erreur: 'Erreur lors de la suppression du membre du projet', message: error.message });
  }
};
const getMembersOfProject = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;

    // Recherche le projet par ID
    const project = await Project.findById(projectId).populate('membres.utilisateur');
    if (!project) {
        console.error("Projet non trouvé.");
        return res.status(404).json({ erreur: "Projet non trouvé." });
    }
    // Récupère les membres du projet
    const members = project.membres;
    // Envoie la réponse
    res.json(members);
  } catch (error) {
    console.error('Erreur lors de l\'affichage des membres du projet :', error);
    res.status(500).json({ erreur: 'Erreur lors de la suppression du membre du projet', message: error.message });
}
};


  module.exports = {
    addProject,
    getProject,
    fetchProject,
    updateProject,
    deleteProject,
    inviteUserToProject,
    removeMemberFromProject,
    getMembersOfProject
    }