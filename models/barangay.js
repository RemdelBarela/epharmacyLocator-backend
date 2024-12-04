const mongoose = require('mongoose');

const barangaySchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
});

barangaySchema.virtual('id').get(function () {
    return this._id.toHexString();
});

barangaySchema.set('toJSON', {
    virtuals: true,
});

exports.Barangay = mongoose.model('Barangay', barangaySchema);
