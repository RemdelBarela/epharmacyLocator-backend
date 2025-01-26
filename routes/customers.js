const { User } = require('../models/user');
const { Customer } = require('../models/customer');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Tesseract = require("tesseract.js");

const { uploadOptions } = require('../utils/cloudinary');
 // Import Cloudinary upload options

  
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
      req.folder = "prescriptions"; // Set the desired Cloudinary folder dynamically
      next();
    },
    uploadOptions.single("prescriptions"), // Handle single file upload
    async (req, res) => {
      try {
        // The uploaded file information is in req.file
        const uploadedImage = req.file;
  
        // Perform OCR using Tesseract.js on the uploaded image URL
        const { data: { text } } = await Tesseract.recognize(uploadedImage.path, 'eng');
  
        // Log the extracted text
        console.log("Extracted OCR Text:", text);
        console.log("IMAGE:", uploadedImage);
        // Respond with Cloudinary image URL and extracted OCR text
        res.json({
          message: "Image uploaded and processed successfully",
          imageUrl: uploadedImage.path, // Cloudinary secure URL
          publicId: uploadedImage.filename, // Public ID in Cloudinary
          ocrText: text, // Extracted text from OCR
        });
      } catch (error) {
        console.error("Error during image upload or OCR processing:", error);
        res.status(500).json({ error: "Failed to process image" });
      }
    }
  );
  
  


module.exports = router;