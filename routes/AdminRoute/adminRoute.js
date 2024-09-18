const express = require("express");
const router = express.Router();
const {
  handleGetWeeklySinup,
  handleGetWeeklyPost,
  DeletePost,
  deleteUser,
  adminCreateUser
} = require("../../controllers/AdminController/adminController");

router.get("/weeklysignup", handleGetWeeklySinup);
router.get("/weeklyPost", handleGetWeeklyPost);
router.post("/deletepost" ,DeletePost )
router.post("/deleteuser", deleteUser)
router.post("/create",adminCreateUser)

module.exports = router;
