const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: Number,
        required: true,
        
    },
    profilePic: {
        type: String,
        default: ""
    },
    backgroundPic: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        default: "user"
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }],
    LikedPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    }],
    online: {
        type: mongoose.Schema.Types.Boolean,
        default: false
    },
    lastActivity:{
        type: Date,
        default: Date.now
    },
    signUpDate: {
        type: Date,
        default: Date.now
    }
})

const commentSchema = mongoose.Schema({
    commentedBy:{
        type: String,
        required: true
    },
    content:{
        type: String,
        required: true
    },
    commentAuthorPic:{
        type: String
    },
    commentAuthorId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    date:{
        type: Date,
        default : Date.now
    }
})

const postSchema = mongoose.Schema({
    authorName :{
        type: String,
        required: true
    },
    authorProfilePic: {
        type: String,
        default: ""
    },
    authorEmail: {
        type: String,
        required: true
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    content:{
        type: String,
        default: ""
    },
    postImage : {
        type: String,
        default: ""
    },
    comment: [commentSchema],
    likedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    likes: {
        type: Number,
        default: 0
    },
    postedAt : {
        type : Date,
        default : Date.now
    }
})
const messageSchema = mongoose.Schema({
    senderId:{ 
        type: String
    },
    recipientId:{ 
        type: String
    },
    content: { 
        type: String
    },
    timestamp: { type: Date, default: Date.now },
  });
userSchema.set('toJSON', {
    transform: (doc, ret, options) => {
      delete ret.password;
      return ret;
    },
  });
const UserModel = mongoose.model("User", userSchema);
const PostModel = mongoose.model("Post", postSchema)
const MessageModel = mongoose.model("message", messageSchema)

module.exports = {UserModel, PostModel, MessageModel}