const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const cookieparser = require("cookie-parser")
const dotenv = require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())
app.use(cors({
    credentials: true
}))
app.use(cookieparser())
mongoose.connect("mongodb://0.0.0.0/meetifydb")
const connc = mongoose.connection
connc.once('open',()=>{
    console.log('connected to database');
    app.listen(PORT, ()=>{
        console.log(`server runing on port: ${PORT}`);
        
    })
});
connc.on('error',(err)=>{
    console.log(`database error:${err}`);
    process.exit()
})

// routes

app.use("/api/user", require("./routes/userRoute/users"))