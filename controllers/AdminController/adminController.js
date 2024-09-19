const { UserModel, PostModel } = require("../../model/schema");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const handleGetWeeklySinup = async (req, res) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1); // or set a different range

    const weeklySignUps = await UserModel.aggregate([
      { $match: { signUpDate: { $gte: oneYearAgo } } },
      {
        $project: {
          week: {
            $isoWeek: "$signUpDate",
          },
          year: {
            $isoWeekYear: "$signUpDate",
          },
        },
      },
      {
        $group: {
          _id: { year: "$year", week: "$week" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.week": 1 },
      },
    ]);

    // Format data for easier use in frontend
    const formattedData = weeklySignUps.map((item) => ({
      week: `${item._id.year}-W${item._id.week}`,
      count: item.count,
    }));

    return res.json(formattedData);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

const handleGetWeeklyPost = async (req, res) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const weeklyPosts = await PostModel.aggregate([
      { $match: { postedAt: { $gte: oneYearAgo } } },
      {
        $project: {
          week: { $isoWeek: "$postedAt" },
          year: { $isoWeekYear: "$postedAt" },
        },
      },
      {
        $group: {
          _id: { year: "$year", week: "$week" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    const formattedData = weeklyPosts.map((item) => ({
      week: `${item._id.year}-W${item._id.week}`,
      count: item.count,
    }));

    return res.json(formattedData);
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
const DeletePost = async (req, res) => {
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
    const findUser = await UserModel.findOne({ email });
    if (!findUser || findUser.role !== "admin" || !findUser.role !== "super-admin")
      return res.status(401).json({ status: "failed", msg: "not authorized" });
    if (!id)
      return res.status(400).json({ status: "failed", msg: "no id passed" });
    const findPost = await PostModel.findById(id);
    if (!findPost)
      return res
        .status(404)
        .json({ status: "failed", msg: "not a valid post id" });
    await PostModel.findByIdAndDelete(id);
    const allFeeds = await PostModel.find();
    return res
      .status(200)
      .json({ status: "success", msg: "post deleted", feeds: allFeeds });
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
const deleteUser = async (req, res) => {
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
    const findUser = await UserModel.findOne({ email });
    if (!findUser || findUser.role !== "admin"  || !findUser.role !== "super-admin")
      return res.status(401).json({ status: "failed", msg: "not authorized" });
    if (!id)
      return res.status(400).json({ status: "failed", msg: "no id passed" });
    const aboutToBeDelUser = await UserModel.findById(id);
    if (!aboutToBeDelUser)
      return res
        .status(404)
        .json({ status: "failed", msg: "not a valid post id" });

    await UserModel.updateMany(
      { friends: aboutToBeDelUser._id }, // Find documents where the friends array contains the userId
      { $pull: { friends: aboutToBeDelUser._id } } // Remove userId from the friends array
    ).exec();

    await PostModel.deleteMany({ authorId: aboutToBeDelUser._id });
    await UserModel.findByIdAndDelete(id);

    const allUsers = await UserModel.find();
    return res
      .status(200)
      .json({
        status: "success",
        msg: "User Account deleted",
        users: allUsers,
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

const adminCreateUser = async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : null;
  const { fullname, password, username, email, phone_number, role } = req.body;
  if (!fullname || !password || !username || !email || !phone_number || !role)
    return res.status(400).json({ status: "failed", msg: "Fill all blank" });

  try {
    if (!token)
      return res.status(401).json({ status: "failed", msg: "access denied" });
    const decoded = jwt.verify(token, process.env.REFRESHTOKEN_SECRET_KEY);
    if (!decoded)
      return res.status(401).json({ status: "failed", msg: "invalid token" });
    const AdminEmail = decoded.email;
    const findUser = await UserModel.findOne({ email: AdminEmail });
    if (!findUser || findUser.role !== "admin" || !findUser.role !== "super-admin")
      return res.status(401).json({ status: "failed", msg: "not authorized" });

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
      role: role,
    });
    await newUser.save();
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSKEY,
      },
    });
    let mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Meetify Account Creation",
      text: `An Account has been created for you.\n\n
      Your credentials are : \n Email : ${email} \n Password : ${password} \n
  Please click the link below to login in:\n
  https://meetify-pearl.vercel.app\n\n`,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return;
      }
      //console.log("Email sent: " + info.response);
    });
    return res
      .status(201)
      .json({ msg: "Account Created and Email sent", status: "success" });
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
  handleGetWeeklySinup,
  handleGetWeeklyPost,
  DeletePost,
  deleteUser,
  adminCreateUser
};
