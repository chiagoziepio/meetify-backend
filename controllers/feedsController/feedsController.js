const jwt = require("jsonwebtoken");
const { PostModel, UserModel } = require("../../model/schema");
const cloudinaryConfig = require("../../config/cloudinaryConfig")
const fs = require("fs");
const handleAddFeed = async (req, res) => {
    const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    const {content} = req.body

    const findUser = await UserModel.findOne({email})
    if(!findUser) return res.status(400).json({status: "failed", msg: "Not a registered user"})
    let url ;
    if(file){
        const filePath = req.file.path;
        const result = await cloudinaryConfig.uploader.upload(filePath, {
            folder: "meetifyPic",
        });
        fs.unlinkSync(filePath);
    }
   
    const newPost = new PostModel({
        authorName: findUser.username,
        authorProfilePic:  findUser.profilePic ? findUser.profilePic : "",
        authorEmail: findUser.email,
        content: content ? content : "",
        postImage: file ? url.secure_url : ""
    })

      await  newPost.save()

    await UserModel.updateOne(
        { email: email },
        {
          $set: {
            lastActivity: Date.now(),
            online: true,
          },
        }
      );

    const allPosts = await PostModel.find()  
    return res
      .status(201)
      .json({ status: "success", msg: "feed created", feeds: allPosts });
  } catch (error) {
    return res.status(500).json({status: "failed", msg: error})
  }
};

module.exports = { handleAddFeed };
