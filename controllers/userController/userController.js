const bcrypt = require("bcryptjs");
const { UserModel, PostModel } = require("../../model/schema");
const jwt = require("jsonwebtoken");
const handleverifyToken = require("../../middleware/verifyJwt");
const uploadToCloudinary = require("../../config/cloudinaryConfig");
const { v2: uuidv2 } = require("uuid"); // For generating unique filenames
const streamifier = require("streamifier"); // Convert buffer to stream
const { handleTokenVerification } = require("../../middleware/verifyJwt");
const fs = require("fs");
const nodemailer = require("nodemailer");

const handleRegisterUser = async (req, res) => {
  const { fullname, password, username, email, phone_number } = req.body;
  if (!fullname || !password || !username || !email || !phone_number)
    return res.status(400).json({ status: "failed", msg: "Fill all blank" });

  try {
    const isUserAlreadyExisting = await UserModel.findOne({ email });
    if (isUserAlreadyExisting)
      return res
        .status(400)
        .json({ status: "failed", msg: "user already existed" });

    const hashPwd = await bcrypt.hash(password, 10);
    const newUser = new UserModel({
      fullname,
      username,
      email,
      phone: +phone_number,
      password: hashPwd,
    });
    newUser.save();

    return res.status(201).json({ status: "success", msg: "User created" });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: "failed", msg: `server error: ${error}` });
  }
};
const handleUserLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ status: "failed", msg: "provide credential" });

  try {
    const findUser = await UserModel.findOne({ email });
    if (!findUser)
      return res
        .status(400)
        .json({ status: "failed", msg: "user not registered" });
    const checkPwd = await bcrypt.compare(password, findUser.password);
    if (!checkPwd)
      return res
        .status(400)
        .json({ msg: "incorrect password", status: "failed" });
    const refreshToken = jwt.sign(
      { email: findUser.email },
      process.env.REFRESHTOKEN_SECRET_KEY,
      { expiresIn: "1h" }
    );
    const userObj = { findUser, token: refreshToken };
    // res.cookie("refreshtoken",refreshToken,{maxAge: 1800000, httpOnly: true,sameSite: 'None'})
    await UserModel.updateOne(
      { email: email },
      {
        $set: {
          online: true,
          lastActivity: Date.now(),
        },
      }
    );

    return res.status(200).json({
      status: "success",
      msg: "User logged in",
      user: findUser,
      token: refreshToken,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: "failed", msg: `server error: ${error}` });
  }
};

const handleUserProfilePicUpload = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;

  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    const fileBuffer = req.file.buffer;
    const result = await uploadToCloudinary(fileBuffer);

    await UserModel.updateOne(
      { email: email },
      {
        $set: {
          profilePic: result.secure_url,
        },
      }
    );

    const updatedUser = await UserModel.findOne({ email });

    await PostModel.updateMany(
      { authorId: updatedUser._id },
      {
        $set: {
          authorProfilePic: updatedUser.profilePic,
        },
      }
    );

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
      .status(200)
      .json({ status: "success", msg: "image updated", user: updatedUser });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(500)
        .json({ status: "failed", msg: "token has expired" });
    } else {
      return res.status(500).json({ status: "failed", msg: error.message });
    }
  }
};
const handleUserBackgroundPIcChange = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;

  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    const fileBuffer = req.file.buffer;
    const result = await uploadToCloudinary(fileBuffer);


    await UserModel.updateOne(
      { email: email },
      {
        $set: {
          backgroundPic: result.secure_url,
        },
      }
    );

    const updatedUser = await UserModel.findOne({ email });
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
      .status(200)
      .json({ status: "success", msg: "image updated", user: updatedUser });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(500)
        .json({ status: "failed", msg: "token has expired" });
    } else {
      return res.status(500).json({ status: "failed", msg: error.message });
    }
  }
};

const handleUserLogout = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;

    await UserModel.updateOne(
      { email: email },
      {
        $set: {
          online: false,
        },
      }
    );
    return res
      .status(200)
      .json({ status: "success", msg: "logged out", token: null });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ status: "failed", msg: "access denied" });
    } else {
      return res.status(500).json({ status: "failed", msg: error.message });
    }
  }
};
const handleGetAllusers = async (req, res) => {
  try {
    const users = await UserModel.find();
    const allusers = users.map((user) => {
      const userObject = user.toObject();
      delete userObject.password; // Remove password field
      return userObject;
    });
    return res.status(200).json({ status: "success", msg: allusers });
  } catch (error) {
    return res.status(500).json({ status: "failed", msg: error });
  }
};

const handleAddFriends = async (req, res) => {
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
    const LoggedInUser = await UserModel.findOne({ email });
    const findUser = await UserModel.findById(id);
    if (!findUser)
      return res
        .status(400)
        .json({ status: "failed", msg: "not a registered user id" });

    if (
      LoggedInUser.friends.some((id) => id.equals(findUser._id)) ||
      findUser.friends.some((id) => id.equals(LoggedInUser._id))
    ) {
      return res.status(400).json({ status: "failed", msg: "already friend" });
    }

    await LoggedInUser.friends.push(findUser._id);
    await findUser.friends.push(LoggedInUser._id);

    await LoggedInUser.save();
    await findUser.save();
    await UserModel.updateOne(
      { email: email },
      {
        $set: {
          lastActivity: Date.now(),
          online: true,
        },
      }
    );
    const updatedUser = await UserModel.findOne({ email });
    return res.status(201).json({
      status: "success",
      msg: "Added to friends list",
      user: updatedUser,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(500)
        .json({ status: "failed", msg: "token has expired" });
    } else {
      return res.status(500).json({ status: "failed", msg: error.message });
    }
  }
};
const handleRemoveFriend = async (req, res) => {
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
    const LoggedInUser = await UserModel.findOne({ email });
    const findUser = await UserModel.findById(id);
    if (!findUser)
      return res
        .status(400)
        .json({ status: "failed", msg: "not a registered user id" });

    if (
      !LoggedInUser.friends.some((id) => id.equals(findUser._id)) ||
      !findUser.friends.some((id) => id.equals(LoggedInUser._id))
    ) {
      return res.status(400).json({ status: "failed", msg: "Not following" });
    }

    const result1 = await UserModel.findOneAndUpdate(
      { _id: LoggedInUser._id },
      { $pull: { friends: findUser._id } },
      { new: true } // Return the updated document
    );
    const result2 = await UserModel.findOneAndUpdate(
      { _id: findUser._id },
      { $pull: { friends: LoggedInUser._id } },
      { new: true } // Return the updated document
    );
    if (!result1) {
      return res
        .status(400)
        .json({ status: "failed", msg: "friend not removed" });
    }
    if (!result2) {
      return res
        .status(400)
        .json({ status: "failed", msg: "friend2 not removed" });
    }

    await UserModel.updateOne(
      { email: email },
      {
        $set: {
          lastActivity: Date.now(),
          online: true,
        },
      }
    );
    return res.status(200).json({
      status: "success",
      msg: "Removed from friends list",
      user: result1,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(500)
        .json({ status: "failed", msg: "token has expired" });
    } else {
      return res.status(500).json({ status: "failed", msg: error.message });
    }
  }
};

const handleGetActiveUsers = async (req, res) => {
  try {
    const users = await UserModel.find({ online: true });
    const activeUsers = users.map((user) => {
      const userObject = user.toObject();
      delete userObject.password; // Remove password field
      return userObject;
    });
    return res.status(200).json({ msg: activeUsers });
  } catch (error) {
    return res.status(500).json({ msg: error });
  }
};

const handleUpdateUserDetails = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  const { fullname, username, email } = req.body;

  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const initialEmail = decoded.email;
    const findUser = await UserModel.findOne({ email: initialEmail });
    if (!findUser)
      return res.status(400).json({ status: "failed", msg: "user not found" });
    if (findUser.email !== email) {
      const isEmailAlreadyExisting = await UserModel.findOne({ email });
      if (isEmailAlreadyExisting)
        return res
          .status(403)
          .json({ status: "failed", msg: "email already taken" });
    }

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: findUser._id },
      {
        $set: {
          fullname,
          username: username,
          email: email,
          lastActivity: Date.now(),
          online: true,
        },
      },
      { new: true }
    );

    await PostModel.updateMany(
      { authorId: findUser._id },
      {
        $set: {
          authorEmail: updatedUser.email,
          authorName: updatedUser.username,
        },
      }
    );

    const refreshToken = jwt.sign(
      { email: updatedUser.email },
      process.env.REFRESHTOKEN_SECRET_KEY,
      { expiresIn: "1h" }
    );
    return res.status(200).json({
      status: "success",
      msg: "details updated",
      user: updatedUser,
      token: refreshToken,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(500)
        .json({ status: "failed", msg: "token has expired" });
    } else {
      return res.status(500).json({ status: "failed", msg: error.message });
    }
  }
};

const handleResetPwd = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  const { password } = req.body;
  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    const findUser = await UserModel.findOne({ email });
    if (!findUser)
      return res.status(400).json({ status: "failed", msg: "user not found" });

    const hashPwd = await bcrypt.hash(password, 10);
    await UserModel.findOneAndUpdate(
      { _id: findUser._id },
      {
        $set: {
          password: hashPwd,
          lastActivity: Date.now(),
          online: true,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      status: "success",
      msg: "password updated",
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(500)
        .json({ status: "failed", msg: "token has expired" });
    } else {
      return res.status(500).json({ status: "failed", msg: error.message });
    }
  }
};
const handleDeleteAcc = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    const findUser = await UserModel.findOne({ email });
    if (!findUser)
      return res.status(400).json({ status: "failed", msg: "user not found" });

    await UserModel.updateMany(
      { friends: findUser._id }, // Find documents where the friends array contains the userId
      { $pull: { friends: findUser._id } } // Remove userId from the friends array
    ).exec();

    await PostModel.deleteMany({ authorId: findUser._id });

    await UserModel.findByIdAndDelete(findUser._id);

    return res.status(200).json({ msg: "account delete" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(500)
        .json({ status: "failed", msg: "token has expired" });
    } else {
      return res.status(500).json({ status: "failed", msg: error.message });
    }
  }
};

const handleForgotPwd = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email)
      return res
        .status(400)
        .json({ msg: "no email provoded", status: "failed" });
    const findUser = await UserModel.findOne({ email });
    if (!findUser)
      return res
        .status(401)
        .json({ status: "failed", msg: "Email  not registered" });
    const pwdResetToken = jwt.sign(
      { email: findUser.email },
      process.env.REFRESHTOKEN_SECRET_KEY,
      { expiresIn: "7m" }
    );

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSKEY,
      },
    });
    let mailOptions = {
      from: process.env.EMAIL,
      to: findUser.email,
      subject: "Meetify Account Password Reset",
      text: `You requested a password reset for your Meetify account.\n\n
  Please click the link below to reset your password:\n
  https://meetify-pearl.vercel.app/${pwdResetToken}\n\n
  If you did not request this, please ignore this email.`,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return
      }
      //console.log("Email sent: " + info.response);
    });

    return res.status(200).json({ msg: "Email sent", status: "success" });
  } catch (error) {
    console.log(error);

    return res.status(500).json({ msg: error.message, status: "failed" });
  }
};

const handleOutsidePwdReset = async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;
  try {
    if (!resetToken)
      return res
        .status(401)
        .json({ status: "failed", msg: "no token provided" });
    if (!password)
      return res
        .status(400)
        .json({ status: "failed", msg: "No password passed" });

    const decoded = jwt.verify(resetToken, process.env.REFRESHTOKEN_SECRET_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const email = decoded.email;
    const findUser = await UserModel.findOne({ email });
    if (!findUser)
      return res.status(401).json({ status: "failed", msg: "no user found" });
    const hashPwd = await bcrypt.hash(password, 10);
    await UserModel.updateOne(
      { _id: findUser._id },
      {
        $set: {
          password: hashPwd,
        },
      }
    );
    return res.status(200).json({ status: "success", msg: "Password changed" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(500)
        .json({ status: "failed", msg: "token has expired" });
    } else {
      return res.status(500).json({ status: "failed", msg: error.message });
    }
  }
};
module.exports = {
  handleRegisterUser,
  handleUserLogin,
  handleUserProfilePicUpload,
  handleUserBackgroundPIcChange,
  handleUserLogout,
  handleGetAllusers,
  handleAddFriends,
  handleRemoveFriend,
  handleGetActiveUsers,
  handleUpdateUserDetails,
  handleResetPwd,
  handleDeleteAcc,
  handleForgotPwd,
  handleOutsidePwdReset,
};
