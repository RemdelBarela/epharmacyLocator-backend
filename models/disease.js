const mongoose = require('mongoose');

const diseasesSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
})

diseasesSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

diseasesSchema.set('toJSON', {
    virtuals: true,
});


exports.Diseases = mongoose.model('Diseases', diseasesSchema);
