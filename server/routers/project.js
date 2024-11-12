const express = require("express");
const router = express.Router();
const ProjectController = require("../controllers/project");
const auth=require('../middleware/auth')

router.get("/:id",ProjectController.fetchProject)

router.post("/invite/:projectId", auth.loggedMiddleware,auth.isManager, ProjectController.inviteUserToProject);

router.patch("/:id", auth.loggedMiddleware, ProjectController.updateProject)

router.post("/add",auth.loggedMiddleware, ProjectController.addProject);

router.delete("/:projectId",auth.loggedMiddleware, auth.isManager, ProjectController.deleteProject);

router.delete('/:projectId/members/:memberId', auth.loggedMiddleware, auth.isManager, ProjectController.removeMemberFromProject);

router.get("/:projectId/members", auth.loggedMiddleware,ProjectController.getMembersOfProject);



module.exports = router;
