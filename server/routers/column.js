const express = require("express");
const router = express.Router();
const ColumnController = require("../controllers/column");

router.get("/:id",ColumnController.fetchColumn)

router.patch("/:id", ColumnController.updateColumn)

router.post("/add/:id", ColumnController.addColumn);

router.delete("/:id", ColumnController.deleteColumn);

router.get("/:nom", ColumnController.getByNom);


module.exports = router;