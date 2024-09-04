const {UserModel} = require("../model/schema")

const checkUserInactivity = async()=>{
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const inActiveUsers = await UserModel.find({lastActivity: {$lt : oneHourAgo}, online: true})
    for(const user of inActiveUsers){
        user.online = false;
        await user.save()
    }
}

module.exports = {checkUserInactivity}