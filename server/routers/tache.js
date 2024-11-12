const express = require("express");
const router = express.Router();
const TacheController = require("../controllers/tache");
const auth = require('../middleware/auth');

router.get("/:id",TacheController.fetchTache);
router.get("/taches/all",TacheController.getTache);


router.patch("/:id", TacheController.updateTache)

router.post("/add/:id", TacheController.addTache);

router.delete("/:id", TacheController.deleteTache);

router.post('/uploadfile/:id', TacheController.uploadFile);
router.post('/:tacheId/move/:targetColumnId', auth.loggedMiddleware,TacheController.moveTacheToColumn);

router.post('/:tacheId/move/:targetColumnId', TacheController.moveTacheToColumn);
router.delete('/:tacheId/files',  TacheController.deleteFileFromTache);





module.exports = router;