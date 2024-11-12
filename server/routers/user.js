const express = require("express");
const router = express.Router();
const userController = require("../controllers/user");
const auth=require('../middleware/auth')

router.post("/signup", userController.signup);
router.patch('/users/photo', auth.loggedMiddleware, userController.updateUserPhoto);
router.patch('/user/update', auth.loggedMiddleware, userController.updateUser);
router.get("/projects", auth.loggedMiddleware, userController.projectsUser);
router.post("/login", userController.login);
router.get("/getU", userController.getUser);
router.get("/:id",userController.fetchUser);
router.put("/users/:id/mark-as-read", userController.markasread);

module.exports = router;