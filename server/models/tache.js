const mongoose = require("mongoose");

const tacheSchema = mongoose.Schema({
    nom : { type : String, required: true},
    description : {type : String, default: ""},
    responsable: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: { type: Date, default: () => moment().toDate() },
    file: [{ type: String }],
    finishedAt: { type: Date, required: false },
    duree_maximale: {type: Number, required: false},
    duree_reelle:{type: Number, required: false},

});

module.exports = mongoose.model("Tache", tacheSchema);