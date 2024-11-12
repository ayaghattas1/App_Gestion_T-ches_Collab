const Column = require("../models/column");
const Project = require("../models/project");

const moment = require('moment-timezone');


const addColumn = async (req, res) =>  {
    try {
        const projectId = req.params.id;
        console.log(projectId);
        
        const project = await Project.findById(projectId);
        if (!project) {
            console.error("Projet non trouvé.");
            return res.status(404).json({ erreur: "Projet non trouvé." });
        }
        
        const columnData = req.body;
        columnData.createdAt = moment().tz('Europe/Paris').toDate();
        if (!columnData.nom) {
          return res.status(400).send({ error: "The column name is required." });
        }
        const newColumn = new Column(columnData);
        await newColumn.save(); // Sauvegarde la colonne d'abord
        
        project.columns.push(newColumn._id); // Ajoute l'ID de la colonne au tableau de colonnes du projet
        await project.save(); // Sauvegarde le projet avec la nouvelle colonne
        
        res.status(200).json({  model: newColumn });
    } catch (error) {
        console.error('Erreur lors de la création de la colonne :', error);
        res.status(500).json({ erreur: 'Erreur lors de la création de la colonne', message: error.message });
    }
};


  const fetchColumn = (req, res) => {
    Column.findOne({ _id: req.params.id })
    .then((column) => {
      if (!column) {
        res.status(404).json({
          message: "objet non trouvé!",
        });
      } else {
        res.status(200).json({
          model: column,
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

  const getColumn = (req, res) => {
    
    Column.find().then((columns) => {
      res.status(200).json({
        model: columns,
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

  const updateColumn = (req, res) => {
    Column.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true }).then(
        (column) => {
          if (!column) {
            res.status(404).json({
              message: "objet non trouvé!",
            });
          } else {
            res.status(200).json({
              model: column,
              message: "objet modifié!",
            });
          }
        }
      )
}
const deleteColumn =  (req, res) => {
  const columnId = req.params.id;

  // First find the project that contains this column and remove the column from its array
  Project.findOneAndUpdate(
    { columns: columnId },
    { $pull: { columns: columnId } },
    { new: true } // This returns the updated document
  )
  .then(project => {
    if (!project) {
      res.status(404).json({ message: "Projet contenant la colonne non trouvé ou colonne déjà retirée!" });
      return;
    }
    // If the project was found and updated, then delete the column
    Column.deleteOne({ _id: columnId })
      .then(result => {
        if (result.deletedCount === 0) {
          res.status(404).json({ message: "Colonne non trouvé!" });
        } else {
          res.status(200).json({ message: "Colonne supprimé avec succès!", details: result });
        }
      })
      .catch(error => {
        res.status(500).json({
          error: error.message,
          message: "Erreur lors de la suppression de la colonne!"
        });
      });

  })
  .catch(error => {
    res.status(500).json({
      error: error.message,
      message: "Erreur lors de la mise à jour du projet!"
    });
  });
};

  const getByNom = (req, res) => {
    const columnNom = req.params.nom ;
  
    Column.find({ nom: columnNom })
      .then((columns) => {
        res.status(200).json({
          model: columns,
          message: `Liste des Columns ${column.nom}!`,
        });
      })
      .catch((error) => {
        res.status(500).json({
          error: error.message,
          message: "Problème d'extraction des To Dos",
        });
      });
  };

  module.exports = {
    addColumn,
    getColumn,
    fetchColumn,
    updateColumn,
    deleteColumn,
    getByNom
    }