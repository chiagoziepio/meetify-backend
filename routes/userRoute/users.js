const express = require("express")
const router = express.Router()
const {handleRegisterUser} = require("../../controllers/userController/userController")

router.post("/register",handleRegisterUser)

module.exports = router