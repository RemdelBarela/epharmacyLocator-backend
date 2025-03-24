const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
  originalImageUrl: {
    type: String,
  },
  processedImageUrl: {
    type: String,
  },
  matchedMedicines: [{
    genericName: String,
    brandName: String,
    matchedFrom: {
      type: String,
      enum: ["genericName", "brandName"], // Indicates which one was matched from the scanned text
      required: true
    }
  }],   
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
