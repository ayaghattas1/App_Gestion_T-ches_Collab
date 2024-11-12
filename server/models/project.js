const mongoose = require("mongoose");

const projectSchema = mongoose.Schema({
    model :{ type : String, enum: ["Kanban", "Scrum"], required: true},
    nom : { type : String, required: true},
    etat :{type : String,  enum: ["In progress","Done"] , required: false},
    completion : {type:Number,default:false},
    membres: [{
        utilisateur: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            enum: ["Developer","developer","collaborator","manager","designer", "Collaborator","Manager","Designer"],
            default: 'Developer'
        }
    }],
    columns: [{
        type: mongoose.Types.ObjectId,
        ref: 'Column',
        required: false,
    }],
    createdAt: { type: Date, default: () => moment().toDate() },
    finishedAt: { type: Date, required: false },
    duree_maximale: {type: Number, required: false},
    duree_reelle:{type: Number, required: false},
});

module.exports = mongoose.model("Project", projectSchema);