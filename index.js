const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const cookieparser = require("cookie-parser")
const dotenv = require("dotenv").config()
const {checkUserInactivity} = require("./ActivityTab/UsersInactivity")
const app = express()
const PORT = process.env.PORT || 3001

//app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(cors({
    origin:[
        'http://localhost:5173'
    ],
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
// checking inactive users
setInterval(()=>checkUserInactivity(), 600000)

// routes

app.use("/api/user", require("./routes/userRoute/users"))
app.use("/api/feeds",require("./routes/FeedsRoute/feeds"))

process.on('exist', ()=>{
    clearInterval(checkUserInactivity)
    console.log("serving shutting down, cleaned up setInterval");
    
})