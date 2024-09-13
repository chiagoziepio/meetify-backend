const express = require("express");
const router = express.Router();
const {
  handleRegisterUser,
  handleUserLogin,
  handleUserProfilePicUpload,
  handleUserBackgroundPIcChange,
  handleUserLogout,
  handleGetAllusers,
  handleAddFriends,
  handleRemoveFriend,
  handleGetActiveUsers,
  handleUpdateUserDetails,
  handleResetPwd
} = require("../../controllers/userController/userController");
const upload = require("../../config/multer");

router.post("/register", handleRegisterUser);
router.post("/login", handleUserLogin);
router.post(
  "/profilepicupload",
  upload.single("image"),
  handleUserProfilePicUpload
);
router.post(
  "/backgroundpicupload",
  upload.single("image"),
  handleUserBackgroundPIcChange
);
router.post("/logout", handleUserLogout);
router.post("/addfriend", handleAddFriends);
router.post("/removefriend", handleRemoveFriend);
router.get("/getallUser", handleGetAllusers);
router.get("/getactiveusers", handleGetActiveUsers)
router.post("/edituser",  handleUpdateUserDetails)
router.post("/resetpassword" , handleResetPwd)
module.exports = router;
