const mongoose = require("mongoose")

const userSchema =  mongoose.Schema({
    email: { type: String, required: true, unique: true},
    password : {type: String, required: true},
    lastname : {type: String},
    firstname : {type: String},
    descriptionprofile: {type: String},
    role: { type: String,
            enum : ["developer","manager","collaborator"],
            default: 'manager'
    },

    photo:{type: String},
    projects: [{
        type: mongoose.Types.ObjectId,
        ref: 'Project',
        required: false
    }],
    bio : {type : String, default: ""},
    notifications: [
        {
          message: { type: String, required: true },
          date: { type: Date, default: Date.now },
          read: { type: Boolean, default: false },
        }
      ],})

module.exports = mongoose.model("User", userSchema)