const express = require("express")
const router = express.Router()
const {handleRegisterUser, handleUserLogin} = require("../../controllers/userController/userController")

router.post("/register",handleRegisterUser)
router.post("/login", handleUserLogin)

module.exports = router