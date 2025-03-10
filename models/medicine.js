const mongoose = require('mongoose');

const medicineSchema = mongoose.Schema({
    brandName: {
        type: String,
        required: true,
    },
    genericName: {
        type: String,
        required: true,
    },
    dosageStrength: {
        type: String,
        required: true,
    },
    dosageForm: {
        type: String,
        required: true,
    },
    classification: {
        type: String,
        required: true,
    },
    category: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicationCategory',
        required: true,
    }],
    description: [{
        type: String,
        required: true,
    }]
});

medicineSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

medicineSchema.set('toJSON', {
    virtuals: true,
});

exports.Medicine = mongoose.model('Medicine', medicineSchema);