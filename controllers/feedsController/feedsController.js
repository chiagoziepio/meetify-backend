const jwt = require("jsonwebtoken");
const { PostModel, UserModel } = require("../../model/schema");
const cloudinaryConfig = require("../../config/cloudinaryConfig");
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
    const { content } = req.body;
    const file = req.file;
    const findUser = await UserModel.findOne({ email });
    if (!findUser)
      return res
        .status(400)
        .json({ status: "failed", msg: "Not a registered user" });
    let url;
    if (file) {
      const filePath = req.file.path;
      const result = await cloudinaryConfig.uploader.upload(filePath, {
        folder: "meetifyPic",
      });
      url = result;
      fs.unlinkSync(filePath);
    }

    const newPost = new PostModel({
      authorName: findUser.username,
      authorProfilePic: findUser.profilePic ? findUser.profilePic : "",
      authorEmail: findUser.email,
      content: content ? content : "",
      postImage: file ? url.secure_url : "",
      authorId : findUser._id
    });

    await newPost.save();

    await UserModel.updateOne(
      { email: email },
      {
        $set: {
          lastActivity: Date.now(),
          online: true,
        },
      }
    );

    const allPosts = await PostModel.find();
    return res
      .status(201)
      .json({ status: "success", msg: "feed created", feeds: allPosts });
  } catch (error) {
    return res.status(500).json({ status: "failed", msg: error });
  }
};

const handleGetFeeds = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;

  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;

    const allFeeds = await PostModel.find();

    await UserModel.updateOne(
      { email: email },
      {
        $set: {
          lastActivity: Date.now(),
          online: true,
        },
      }
    );

    return res
      .status(201)
      .json({ status: "success", msg: "new feeds", feeds: allFeeds });
  } catch (error) {
    return res.status(500).json({ status: "failed", msg: error });
  }
};

const handleLikePost = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  const { id } = req.body;
  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    if (!id)
      return res.status(400).json({ status: "failed", msg: "no id passed" });
    const findPost = await PostModel.findById(id);
    const findUser = await UserModel.findOne({email});
    if (!findPost)
      return res.status(400).json({ status: "failed", msg: "invalid feed id" });
    if (!findUser)
      return res
        .status(400)
        .json({ status: "failed", msg: "user doest exist" });
    const hasLikedBefore = findPost.likedBy.some((id) =>
      id.equals(findUser._id)
    );

    if (!hasLikedBefore) {
      await findPost.likedBy.push(findUser._id);
      findPost.likes = findPost.likedBy.length;
      await findUser.LikedPosts.push(findPost._id);
    } else {
      const res1 = await PostModel.findOneAndUpdate(
        { _id: findPost._id },
        { $pull: { likedBy: findUser._id } },
        { new: true }
      );
      const result2 = await UserModel.findOneAndUpdate(
        { _id: findUser._id },
        { $pull: { LikedPosts: findPost._id } },
        { new: true }
      );
      findPost.likes = res1.likedBy.length;
    }
    await findUser.save();
    await findPost.save();

    const allFeeds = await PostModel.find()
    await UserModel.updateOne(
      { email: email },
      {
        $set: {
          lastActivity: Date.now(),
          online: true,
        },
      }
    );
    return res.status(200).json({status: "success" , msg: "likes updated" , feeds : allFeeds});
  } catch (error) {
    return res.status(500).json({status: "failed", msg: error });
  }
};

const handlePostComment = async(req,res)=>{
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  const { id,content } = req.body;
  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    if (!id)
      return res.status(400).json({ status: "failed", msg: "no id passed" });
    const findPost = await PostModel.findById(id);
    const findUser = await UserModel.findOne({email});
    if (!findPost)
      return res.status(400).json({ status: "failed", msg: "invalid feed id" });
    if (!findUser)
      return res
        .status(400)
        .json({ status: "failed", msg: "user doest exist" });
    findPost.comment.push({
      commentedBy: findUser.username,
      content: content,
      commentAuthorPic : findUser.profilePic ? findUser.profilePic : "",
      commentAuthorId : findUser._id
    })
    await findPost.save()
    const allFeeds = await PostModel.find()
    await UserModel.updateOne(
      { email: email },
      {
        $set: {
          lastActivity: Date.now(),
          online: true,
        },
      }
    );

    return res.status(201).json({status: "success", feeds: allFeeds})
  } catch (error) {
    return res.status(500).json({status: "failed" , msg: error})
  }
}

module.exports = {
  handleAddFeed,
  handleGetFeeds,
  handleLikePost,
  handlePostComment
};
