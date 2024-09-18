const multer = require("multer")
const path = require("path")
const cloudinary = require("../config/cloudinaryConfig")

const storage = multer.memoryStorage(); 

const upload = multer({
    storage: storage
})

module.exports = upload
