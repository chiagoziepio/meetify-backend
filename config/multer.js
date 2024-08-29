const multer = require("multer")
const path = require("path")

module.exports = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req,file,cb)=>{
        let ext = path.extname(file.originalname);
        if(ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg"){
            cb( new Error("file type not supported"), false )
            return
        }
        cb(null, true)
    }
})