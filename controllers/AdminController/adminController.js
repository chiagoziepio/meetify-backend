const { UserModel, PostModel } = require("../../model/schema");
const jwt = require("jsonwebtoken")

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
    if (!findUser || findUser.role !== "admin")
      return res.status(401).json({ status: "failed", msg: "not authorized" });
    if (!id)
      return res.status(400).json({ status: "failed", msg: "no id passed" });
    const findPost = await PostModel.findById(id);
    if (!findPost)
      return res
        .status(404)
        .json({ status: "failed", msg: "not a valid post id" });
    await PostModel.findByIdAndDelete(id);
    return res.status(200).json({ status: "success", msg: "post deleted" });
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
module.exports = { handleGetWeeklySinup, handleGetWeeklyPost, DeletePost };
