const express = require("express");
const router = express.Router();
const {
  handleGetWeeklySinup,
  handleGetWeeklyPost,
  DeletePost
} = require("../../controllers/AdminController/adminController");

router.get("/weeklysignup", handleGetWeeklySinup);
router.get("/weeklyPost", handleGetWeeklyPost);
router.post("/deletepost" ,DeletePost )

module.exports = router;
