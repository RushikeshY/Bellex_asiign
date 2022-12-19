const mongoose = require("mongoose")

const RegisterSchema = new mongoose.Schema({
    username : {type:String },
    password :{type:String},
    role:String
//     username: <username> with character between 3 to 10,
// password: <password> with characters between 8 to 15. It should have atleast one Uppercase and
// lowercase letter, one number,
// role: <roleid>

})

module.exports = mongoose.model("registerData",RegisterSchema)