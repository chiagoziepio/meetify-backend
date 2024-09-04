const express = require("express")
const router = express.Router()
const {handleRegisterUser, handleUserLogin,handleUserProfilePicUpload,handleUserBackgroundPIcChange, handleUserLogout,handleGetAllusers, handleAddFriends } = require("../../controllers/userController/userController")
const upload = require("../../config/multer")


router.post("/register",handleRegisterUser)
router.post("/login", handleUserLogin)
router.post("/profilepicupload",upload.single('image'), handleUserProfilePicUpload)
router.post("/backgroundpicupload",upload.single('image'),handleUserBackgroundPIcChange )
router.post("/logout",handleUserLogout)
router.post("/addfriend", handleAddFriends)
router.get("/getallUser", handleGetAllusers)
module.exports = router