const Tache = require("../models/tache");
const Column = require("../models/column");
const multer = require('multer');
// const moment = require('moment-timezone');
const path = require('path');
const upload = require('../middleware/multer');
const User = require('../models/user');

const Task = require('../models/tache');
const moment = require('moment');

const addNotification = async (userId, message) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: { notifications: { message } }
    });
  } catch (error) {
    console.error('Error adding notification:', error);
  }
};

const notifyTasksDueSoon = async () => {
  const tomorrow = moment().add(1, 'day').startOf('day').toDate();
  const dayAfterTomorrow = moment().add(2, 'days').startOf('day').toDate();

  const tasks = await Task.find({
    finishedAt: { $gte: tomorrow, $lt: dayAfterTomorrow }
  }).populate('responsable');

  tasks.forEach(async (task) => {
    const message = `Task "${task.nom}" is due soon.`;
    await addNotification(task.responsable._id, message);
  });
};

// Schedule this function to run every day at midnight
const schedule = require('node-schedule');
schedule.scheduleJob('0 0 * * *', notifyTasksDueSoon);
console.log('Task notification scheduler started');

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//       cb(null, 'uploads/files') // Spécifie le dossier où les fichiers seront stockés
//   },
//   filename: function (req, file, cb) {
//       // Génère un nom de fichier unique pour éviter les collisions
//       cb(null, Date.now() + '-' + file.originalname)
//   }
// });
// Configure Multer storage with a custom directory and filename
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // Define the directory where files should be saved (adjust this path)
//     const uploadPath = path.join(__dirname, 'uploads');
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     // Create a unique filename with a timestamp
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const newFilename = `${file.fieldname}-${uniqueSuffix}-${file.originalname}`;
//     cb(null, newFilename);
//   }
// });
// Initialise l'objet upload avec les options de configuration
// const upload = multer({ storage: storage });

const addTache = async (req, res) => {
  try {
      const columnId = req.params.id;
      
      const column = await Column.findById(columnId);
      if (!column) {
          console.error("Colonne non trouvée.");
          return res.status(404).json({ erreur: "Colonne non trouvée." });
      }
      
      const tacheData = req.body;
      tacheData.createdAt = moment().tz('Europe/Paris').toDate();
      
      const newTache = new Tache(tacheData);
      await newTache.populate('responsable');
      await newTache.save(); // Sauvegarde la tâche d'abord
      console.log('Nouvelle tâche créée :', newTache);
      console.log('resp', newTache.responsable._id);
      

      await addNotification(newTache.responsable._id, `A new task has been assigned to you: ${newTache.nom}`); // Send a notification to the responsible person

      column.taches.push(newTache._id); // Ajoute l'ID de la tâche au tableau de tâches de la colonne
      await column.save(); // Sauvegarde la colonne avec la nouvelle tâche
      
      res.json(newTache); 
  } catch (error) {
      console.error('Erreur lors de la création de la tâche :', error);
      res.status(500).json({ erreur: 'Erreur lors de la création de la tâche', message: error.message });
  }
};
  const fetchTache = (req, res) => {
    Tache.findOne({ _id: req.params.id })
    .then((tache) => {
      if (!tache) {
        res.status(404).json({
          message: "objet non trouvé!",
        });
      } else {
        res.status(200).json({
          model: tache,
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
  const getTache = (req, res) => {
    Tache.find().then((taches) => {
      res.status(200).json({
        model: taches,
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
  const updateTache = (req, res) => {
    Tache.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true }).then(
        (tache) => {
          if (!tache) {
            res.status(404).json({
              message: "objet non trouvé!",
             
            });
          } else {
            res.status(200).json({
              model: tache,
              message: "objet modifié!",
            });
          }
        }
      )
};

const deleteTache = async (req, res) => {
  try {
      const tacheId = req.params.id;
      
      // Trouver la tâche à supprimer
      const tache = await Tache.findById(tacheId);
      if (!tache) {
          return res.status(404).json({ message: "Tache non trouvée !" });
      }

      // Trouver la colonne à laquelle appartient la tâche
      const colonne = await Column.findOneAndUpdate(
          { taches: tacheId },
          { $pull: { taches: tacheId } },
          { new: true }
      );

      // Supprimer la tâche
      const result = await Tache.deleteOne({ _id: tacheId });

      if (result.deletedCount === 0) {
          return res.status(404).json({ message: "Tache non trouvée !" });
      }

      res.status(200).json({ message: "Tache supprimée avec succès !" });
  } catch (error) {
      res.status(500).json({ error: error.message, message: "Une erreur est survenue lors de la suppression de la tâche !" });
  }
};
// const deleteTache = (req, res) => {
//     Tache.deleteOne({ _id: req.params.id })
//       .then((result) => {
//         if (result.deletedCount === 0) {
//           res.status(404).json({
//             message: "Tache non trouvé !",
//           });
//         } else {
//           res.status(200).json({
//             model: result,
//             message: "Tache supprimé!",
//           });
//         }
//       })
//       .catch((error) => {
//         res.status(400).json({
//           error: error.message,
//           message: "Données invalides!",
//         });
//       });
//   };
//   const uploadFile = async (req, res, next) => {
//     try {
//         // Utilisez le middleware Multer pour gérer le téléchargement de fichiers
//         upload.single('file')(req, res, async function (err) {
//             if (err instanceof multer.MulterError) {
//                 // Une erreur Multer s'est produite lors du téléchargement du fichier
//                 return res.status(400).json({ error: 'Erreur lors du téléchargement du fichier', message: err.message });
//             } else if (err) {
//                 // Une autre erreur s'est produite
//                 return res.status(500).json({ error: 'Erreur lors du téléchargement du fichier', message: err.message });
//             }

//             // Récupère l'ID de la tâche à laquelle le fichier doit être ajouté
//             const tacheId = req.params.id;

//             // Vérifie si la tâche existe
//             const tache = await Tache.findById(tacheId);
//             if (!tache) {
//                 return res.status(404).json({ error: 'Tâche non trouvée' });
//             }

//             // Initialise la propriété file comme un tableau vide si elle n'est pas définie
//             if (!tache.file) {
//                 tache.file = [];
//             }

//             // Ajoute le fichier à la liste des fichiers de la tâche
//             tache.file.push(req.file.path);

//             // Enregistre les modifications dans la base de données
//             await tache.save();

//             res.status(200).json({ message: 'Fichier ajouté avec succès à la tâche',  model: tache });
//         });
//     } catch (error) {
//         console.error('Erreur lors de l\'ajout du fichier :', error);
//         res.status(500).json({ error: 'Erreur lors de l\'ajout du fichier', message: error.message });
//     }
// };
const uploadFile = async (req, res, next) => {
  upload.single('file')(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
          // Handle errors related to multer limits, incorrect form data, etc.
          return res.status(400).json({ error: 'File upload error', message: err.message });
      } else if (err) {
          // Handle other errors
          return res.status(500).json({ error: 'File upload error', message: err.message });
      }

      // Proceed only if a file has been uploaded
      if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
      }

      // Assuming the task ID is passed via route parameters
      const { id: tacheId } = req.params;

      try {
          // Fetch the task from the database
          const tache = await Tache.findById(tacheId);
          if (!tache) {
              return res.status(404).json({ error: 'Task not found' });
          }

          // Initialize the file property if it's not already an array
          if (!tache.file) {
              tache.file = [];
          }

          // Construct a publicly accessible URL for the file
          const fileUrl = `uploads/${req.file.filename}`;

          // Add the new file URL to the task's file array
          tache.file.push(fileUrl);

          // Save the updated task
          await tache.save();

          // Respond with success
          res.status(200).json({ message: 'File added successfully to the task', model: tache });
      } catch (error) {
          console.error('Error updating task with new file:', error);
          res.status(500).json({ error: 'Error updating task', message: error.message });
      }
  });
};

// const moveTacheToColumn = async (req, res) => {
//   try {
//       const { tacheId, targetColumnId } = req.params;

//       // Récupérer la tâche et la colonne cible
//       const tache = await Tache.findById(tacheId);
//       const targetColumn = await Column.findById(targetColumnId);

//       if (!tache || !targetColumn) {
//           return res.status(404).json({ error: 'Tâche ou colonne non trouvée' });
//       }

//       // Retirer la tâche de sa colonne actuelle
//       const sourceColumn = await Column.findOne({ taches: tacheId });
//       if (sourceColumn) {
//           sourceColumn.taches.pull(tacheId);
//           await sourceColumn.save();
//       }

//       // Ajouter la tâche à la colonne cible
//       targetColumn.taches.push(tacheId);
//       await targetColumn.save();

//       res.status(200).json({ message: 'Tâche déplacée avec succès vers la nouvelle colonne' });
//   } catch (error) {
//       console.error('Erreur lors du déplacement de la tâche :', error);
//       res.status(500).json({ error: 'Erreur lors du déplacement de la tâche', message: error.message });
//   }
// };

// const moveTacheToColumn = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { tacheId, targetColumnId } = req.params;

//     const tache = await Tache.findById(tacheId).session(session);
//     const targetColumn = await Column.findById(targetColumnId).session(session);
//     if (!tache || !targetColumn) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ error: 'Tâche ou colonne non trouvée' });
//     }

//     const sourceColumn = await Column.findOne({ taches: tacheId }).session(session);
//     if (sourceColumn) {
//       sourceColumn.taches.pull(tacheId);
//       await sourceColumn.save({ session });
//     }

//     targetColumn.taches.push(tacheId);
//     await targetColumn.save({ session });

//     await session.commitTransaction();
//     session.endSession();
//     res.status(200).json({ message: 'Tâche déplacée avec succès vers la nouvelle colonne' });
//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error('Erreur lors du déplacement de la tâche :', error);
//     res.status(500).json({ error: 'Erreur lors du déplacement de la tâche', message: error.message });
//   }
// };
const mongoose = require("mongoose");

const moveTacheToColumn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { tacheId, targetColumnId } = req.params;
    
    const tache = await Tache.findById(tacheId).session(session);
    const targetColumn = await Column.findById(targetColumnId).session(session);
    if (!tache || !targetColumn) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Tâche ou colonne non trouvée' });
    }
    if (String(tache.responsable)!==  String(req.auth.userId)) {
      console.log(String(tache.responsable),  String(req.auth.userId));
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Vous n\'êtes pas autorisé à déplacer cette tâche' });
    }
    const sourceColumn = await Column.findOne({ taches: tacheId }).session(session);
    if (!sourceColumn) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Colonne source non trouvée' });
    }

    sourceColumn.taches.pull(tacheId);
    await sourceColumn.save({ session });

    targetColumn.taches.push(tacheId);
    await targetColumn.save({ session });

    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      message: 'Tâche déplacée avec succès vers la nouvelle colonne',
      tache: tache, // Include the updated task information in the response
      sourceColumn: sourceColumn, // Include source column information in the response
      targetColumn: targetColumn // Include target column information in the response
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Erreur lors du déplacement de la tâche :', error);
    res.status(500).json({ error: 'Erreur lors du déplacement de la tâche', message: error.message });
  }
};

const deleteFileFromTache = async (req, res) => {
  const { tacheId } = req.params;
  const  fileUrl  = req.body.data; 

  try {
    const tache = await Tache.findById(tacheId);
    if (!tache) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
   

    tache.file = tache.file.filter(file => file !== fileUrl);
    await tache.save();

    res.status(200).json({ message: 'Fichier supprimé avec succès de la tâche', model: tache });
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier :', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du fichier', message: error.message });
  }
};




  module.exports = {
    addTache,
    getTache,
    fetchTache,
    updateTache,
    deleteTache,
    uploadFile,
    moveTacheToColumn,
    deleteFileFromTache,
    }