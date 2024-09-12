const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const cookieparser = require("cookie-parser")
const dotenv = require("dotenv").config()
const {checkUserInactivity} = require("./ActivityTab/UsersInactivity")
const http = require('http');
const socketIo = require('socket.io');
const{ MessageModel} = require("./model/schema")

const app = express()
const server = http.createServer(app);
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
    server.listen(PORT, ()=>{
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
// Initialize socket.io
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});


io.on('connection', (socket) => {
   
    socket.on('join room', (userId) => {
        socket.join(userId);
       // console.log(`User ${socket.id} joined room ${userId}`);
    });

    socket.on('chat message', async ({ toUserId, msg, fromUserId }) => {
        const message = new MessageModel({
            senderId: fromUserId,
            recipientId: toUserId,
            content: msg,
        });
        try {
            await message.save();
            // Emit a structured message object
            io.to(toUserId).emit('chat message', {
                content: msg,
                fromUserId,
                toUserId,
                timestamp: new Date().toISOString()
            });
            await UserModel.updateOne(
                { _id: fromUserId},
                {
                  $set: {
                    lastActivity: Date.now(),
                    online: true,
                  },
                }
              );
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    socket.on('disconnect', () => {
    });
});

app.use("/api/user", require("./routes/userRoute/users"))
app.use("/api/feeds",require("./routes/FeedsRoute/feeds"))

process.on('exist', ()=>{
    clearInterval(checkUserInactivity)
    console.log("serving shutting down, cleaned up setInterval");
    
})