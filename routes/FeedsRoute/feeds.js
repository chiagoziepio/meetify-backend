const express = require("express");
const router = express.Router();
const {
  handleAddFeed,
  handleGetFeeds,
  handleLikePost,
  handlePostComment,
  handleDeletePost
} = require("../../controllers/feedsController/feedsController");
const upload = require("../../config/multer");

router.post("/addfeed", upload.single("image"), handleAddFeed);
router.get("/getfeeds", handleGetFeeds);
router.post("/togglelike", handleLikePost);
router.post("/addcomment",handlePostComment)
router.post("/deletepost", handleDeletePost)

module.exports = router;
