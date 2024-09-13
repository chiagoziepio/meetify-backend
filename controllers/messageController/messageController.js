const {MessageModel} = require("../../model/schema")

const handleGetMessage =  async(req,res)=>{
    try {
        const userId = req.params.userId;
        const messages = await MessageModel.find({ recipientId: userId }).sort({ timestamp: 1 });
      return  res.json(messages);
    } catch (error) {
       return res.status(500).json(error)
    }
}

module.exports = {handleGetMessage}