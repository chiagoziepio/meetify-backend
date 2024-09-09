const express = require("express");
const router = express.Router();
const {
  handleAddFeed,
  handleGetFeeds,
  handleLikePost,
  handlePostComment
} = require("../../controllers/feedsController/feedsController");
const upload = require("../../config/multer");

router.post("/addfeed", upload.single("image"), handleAddFeed);
router.get("/getfeeds", handleGetFeeds);
router.post("/togglelike", handleLikePost);
router.post("/addcomment",handlePostComment)

module.exports = router;
