const mongoose = require('mongoose');

const medicationCategorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    }
});

medicationCategorySchema.virtual('id').get(function () {
    return this._id.toHexString();
});

medicationCategorySchema.set('toJSON', {
    virtuals: true,
});

exports.MedicationCategory = mongoose.model('MedicationCategory', medicationCategorySchema);
