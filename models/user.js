const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    name: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: function () {
            return this.role === "Customer"; 
        }
    },
    street: {
        type: String,
        required: function () {
            return this.role === "PharmacyOwner"; 
        }
    },
    barangay: {
        type: String,
        required: function () {
            return this.role === "PharmacyOwner"; 
        }
    },
    city: {
        type: String,
        required: function () {
            return this.role === "PharmacyOwner"; 
        }
    },
    role: {
        type: String,
        enum: ["PharmacyOwner", "Customer", "Admin"],
        required: true
    },
    verified: {
        type: Boolean,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userSchema.set('toJSON', {
    virtuals: true,
});

exports.User = mongoose.model('User', userSchema);