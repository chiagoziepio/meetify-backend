const express = require("express")
const {handleGetMessage} = require("../../controllers/messageController/messageController")
const router = express.Router()

router.get("/:userId", handleGetMessage)

module.exports = router