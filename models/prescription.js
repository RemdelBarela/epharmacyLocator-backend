const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
  originalImageUrl: {
    type: String,
  },
  processedImageUrl: {
    type: String,
  },
  matchedMedicines: [{ type: String }],
  ocrText: {
    type: String,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

prescriptionSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

prescriptionSchema.set("toJSON", {
  virtuals: true,
});

exports.Prescription = mongoose.model("Prescription", prescriptionSchema);
