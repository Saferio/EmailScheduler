const mongoose=require("mongoose")
const Schema = mongoose.Schema

const DetailSchema= new Schema({
    subject : {
        type : String,
        required : true
    },
    text : {
        type : String,
        required : true
    },
    emaiId : {
        type : [String],
        required : true
    },
    time:{
        type: Date,
        required : true
    },
    status :{
        type: Number,
        default: 0
    }
})


let Details = module.exports = mongoose.model('Details', DetailSchema)