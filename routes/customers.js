const { User } = require('../models/user');
const { Customer } = require('../models/customer');
const { Prescription } = require('../models/prescription')
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Tesseract = require("tesseract.js");
const Jimp = require("jimp").default;
const tf = require("@tensorflow/tfjs-node");
const fs = require("fs").promises;
const axios = require("axios");
const { uploadOptions } = require('../utils/cloudinary');
const cloudinary = require("cloudinary").v2;

// Update customer's location
router.patch('/:id/update-location', async (req, res) => {
    const { id } = req.params; // This should be the userId from the JWT token
    const { latitude, longitude } = req.body;

    try {
        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: 'Latitude and longitude are required.' });
        }

        // Search for the customer by userInfo (assuming userInfo refers to the userId)
        const customer = await Customer.findOne({ 'userInfo': id });
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found.' });
        }

        customer.location = { latitude, longitude };
        await customer.save();

        res.status(200).json({ message: 'Location updated successfully.', location: customer.location });
    } catch (error) {
        res.status(500).json({ message: 'Error updating location.', error });
    }
});

router.post(
  "/scan-prescription",
  (req, res, next) => {
    req.folder = "prescriptions";
    next();
  },
  uploadOptions.single("prescriptions"),
  async (req, res) => {
    try {
      const imageUrl = req.file.path; // Cloudinary URL of original image
      console.log("Processing image:", imageUrl);

      // **STEP 1: DOWNLOAD IMAGE FROM CLOUDINARY**
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(response.data);

      // **STEP 2: CONVERT IMAGE TO TENSOR**
      let imageTensor = tf.node.decodeImage(imageBuffer, 3);

      // **STEP 3: CONVERT TO GRAYSCALE**
      imageTensor = imageTensor.mean(2).expandDims(-1);

      // **STEP 4: NORMALIZE PIXEL VALUES (0 TO 1)**
      imageTensor = imageTensor.div(255.0);

      // **STEP 5: APPLY THRESHOLDING**
      const threshold = 0.4;
      let binarizedTensor = imageTensor.greater(tf.scalar(threshold)).toFloat();

     // **STEP 6: INVERT COLORS (Make text white, background black)**
      binarizedTensor = tf.sub(1, binarizedTensor);

      // **STEP 7: DILATE TEXT STROKES (Thicken text)**
      const kernelSize = 3; // Adjust size for thickness
      const kernel = tf.ones([kernelSize, kernelSize, 1, 1]);

      binarizedTensor = tf.conv2d(
        binarizedTensor.expandDims(0), 
        kernel, 
        1, 
        "same"
      ).squeeze(0);

      // **STEP 8: INVERT COLORS BACK (Restore original text color)**
      binarizedTensor = tf.sub(1, binarizedTensor);

      // **STEP 9: RESTORE PIXEL VALUES (0-255 RANGE)**
      binarizedTensor = binarizedTensor.mul(255).cast("int32");


      // **STEP 10: CONVERT BACK TO IMAGE FORMAT**
      const processedBuffer = await tf.node.encodeJpeg(binarizedTensor);

      // **STEP 11: UPLOAD PROCESSED IMAGE TO CLOUDINARY**
      const uploadedResponse = await cloudinary.uploader.upload_stream(
        { folder: "processed_prescriptions" },
        async (error, result) => {
          if (error) {
            console.error("Error uploading processed image:", error);
            return res.status(500).json({ error: "Failed to upload processed image" });
          }

          // **STEP 10: OCR USING TESSERACT**
          const { data: { text } } = await Tesseract.recognize(processedBuffer, "epharmacy_finetunedver2", { psm: 6 });
          console.log("Extracted OCR Text:", text);

          res.json({
            message: "Image uploaded, processed, and saved successfully",
            originalImageUrl: imageUrl,
            processedImageUrl: result.secure_url,
            ocrText: text.trim() || "No text detected",
          });
        }
      );

      // Write processedBuffer to Cloudinary stream
      uploadedResponse.end(processedBuffer);
    } catch (error) {
      console.error("Error during image preprocessing or OCR:", error);
      res.status(500).json({ error: "Failed to process image" });
    }
  }
);

router.post("/upload-prescription", async (req, res) => {
  try {
    let { originalImageUrl, processedImageUrl, ocrText, matchedMedicines, customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: "Customer ID is required." });
    }

    if (!Array.isArray(matchedMedicines)) {
      matchedMedicines = [];
    } else {
      matchedMedicines = matchedMedicines.filter(med => med);
    }

    const newPrescription = new Prescription({
      originalImageUrl,
      processedImageUrl,
      ocrText,
      matchedMedicines,
      customerId,
    });

    await newPrescription.save();

    res.json({
      message: "Prescription uploaded successfully",
      prescription: newPrescription,
    });
  } catch (error) {
    console.error("Error uploading prescription:", error);
    res.status(500).json({ error: "Failed to upload prescription" });
  }
});

router.get("/:customerId/prescriptions", async (req, res) => {
  try {
    const { customerId } = req.params;
    const prescriptions = await Prescription.find({ customerId }).sort({ createdAt: -1 });

    if (!prescriptions.length) {
      return res.status(404).json({ message: "No prescriptions found." });
    }

    res.json({ prescriptions });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    res.status(500).json({ error: "Failed to fetch prescriptions." });
  }
});

router.get("/mostScannedMedicines", async (req, res) => {
  try {
    const medicineCounts = await Prescription.aggregate([
      {
        $project: {
          uniqueMedicines: {
            $setUnion: [
              {
                $map: {
                  input: "$matchedMedicines",
                  as: "med",
                  in: {
                    $cond: {
                      if: { $eq: ["$$med.matchedFrom", "brandName"] },
                      then: "$$med.brandName",
                      else: "$$med.genericName",
                    },
                  },
                },
              },
            ],
          },
        },
      },
      { $unwind: "$uniqueMedicines" }, // Split unique medicines into separate documents
      {
        $group: {
          _id: "$uniqueMedicines",
          count: { $sum: 1 }, // Count occurrences
        },
      },
      { $sort: { count: -1 } }, // Sort by highest count
      { $limit: 5 }, // Limit to top 10 medicines
    ]);

    if (!medicineCounts || medicineCounts.length === 0) {
      return res.status(404).json({ message: "No scanned medicines found." });
    }

    res.status(200).json({
      success: true,
      mostScannedMedicines: medicineCounts,
    });
  } catch (error) {
    console.error("Error fetching most scanned medicines:", error);
    res.status(500).json({ message: "An error occurred while fetching data." });
  }
});


router.get('/user/:userId', async (req, res) => {
  try {
      const customer = await Customer.findOne({ userInfo: req.params.userId });
      if (!customer) return res.status(404).json({ message: 'Customer not found' });

      res.json({ customerId: customer._id });
  } catch (error) {
      res.status(500).json({ message: 'Error fetching customer ID', error });
  }
});

router.get("/customers/:customerId", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ consentGiven: customer.consentGiven });
  } catch (error) {
    res.status(500).json({ message: "Error fetching consent", error });
  }
});

// Update user consent
router.post("/customers/consent", async (req, res) => {
  try {
    const { customerId, consentGiven } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.consentGiven = consentGiven;
    await customer.save();

    res.status(200).json({ message: "Consent updated successfully", consentGiven });
  } catch (error) {
    res.status(500).json({ message: "Error updating consent", error });
  }
});


module.exports = router;