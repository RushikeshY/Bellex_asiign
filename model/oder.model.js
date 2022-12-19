
const mongoose= require("mongoose")

const OrderSchema = new mongoose.Schema({
     order_id : {type:String},
    product_name:{type:String},
    product_price:{type:Number},
    quantity : {type:Number},
    userId : {type:String},
    status : {type:String, default:"new"},
    "username" : {type:String}
    // "product_name": "<string-value with characters between 3 to 10>",
    // "product_price": "<numeric value in the range 100 to 1000>",
    // "quantity": "<numeric value in the range 1 to 10>"
})

 module.exports = mongoose.model("order",OrderSchema)