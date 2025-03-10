const mongoose = require('mongoose');

const feedbackSchema = mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    name: {
        type: Boolean,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
    },
    comment: {
        type: String,
    },
    pharmacy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true,
    }
});

feedbackSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

feedbackSchema.set('toJSON', {
    virtuals: true,
});

exports.Feedback = mongoose.model('Feedback', feedbackSchema);