const mongoose = require('mongoose');

const pharmacyStockSchema = mongoose.Schema({
    medicine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: true,
    },
    expirationPerStock: [
        {
            stock: {
                type: Number,
                required: true,
            },
            expirationDate: {
                type: Date,
            },
        }
    ],
    timeStamps: {
        type: String,
        required: true
    },
    pharmacy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true,
    }
});

pharmacyStockSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

pharmacyStockSchema.set('toJSON', {
    virtuals: true,
});

exports.PharmacyStock = mongoose.model('PharmacyStock', pharmacyStockSchema);