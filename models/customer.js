const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    images: [{
        type: String
    }],
    userInfo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    location: {
        latitude: {
            type: String,
        },
        longitude: {
            type: String,
        },
    },
    consentGiven: { type: Boolean, default: null } 
});

customerSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

customerSchema.set('toJSON', {
    virtuals: true,
});

exports.Customer = mongoose.model('Customer', customerSchema);