const multer = require("multer")
const path = require("path")
const cloudinary = require("../config/cloudinaryConfig")

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, 'uploads/')
    },
    filename: function(req,file,cb){
        cb(null, Date.now()+ '_' + file.originalname)
    }
})

//const storage = multer.memoryStorage(); // Use memory storage for multer
const upload = multer({
    storage: storage
})

module.exports = upload



/* module.exports = multer({
    storage: multer.diskStorage({}),
    fileFilter: (req,file,cb)=>{
        let ext = path.extname(file.originalname);
        if(ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg"){
            cb( new Error("file type not supported"), false )
            return
        }
        cb(null, true)
    }
}) */