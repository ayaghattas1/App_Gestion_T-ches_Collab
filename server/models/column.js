const mongoose = require("mongoose");

const columnSchema = mongoose.Schema({
    nom : { type : String, required: false},
    taches: [{
        type: mongoose.Types.ObjectId,
        ref: 'Taches',
        required: false,
    }],
    createdAt: { type: Date, default: () => moment().toDate() },
});

module.exports = mongoose.model("Column", columnSchema);