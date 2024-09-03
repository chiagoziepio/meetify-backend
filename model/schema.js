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
        default: Date.now()
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
    date:{
        type: Date,
        default : Date.now
    }
})

const likesSchema = mongoose.Schema({
    likedBy:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    count: {
        type: Number,
        default: 0
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
    content:{
        type: String,
        default: ""
    },
    postImages:[{
        type: String,
        default:  []
    }],
    comment: [commentSchema],
    likes: [likesSchema]
})

const UserModel = mongoose.model("User", userSchema);
const PostModel = mongoose.model("Post", postSchema)

module.exports = {UserModel, PostModel}