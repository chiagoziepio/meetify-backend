const express = require("express");
const router = express.Router();
const {
  handleAddFeed,
} = require("../../controllers/feedsController/feedsController");
const upload = require("../../config/multer");

router.post("/addfeed",upload.single("image"), handleAddFeed);

module.exports = router