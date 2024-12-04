const express = require("express");
const { Barangay } = require("../models/barangay"); // Your Barangay model
const { uploadOptions } = require("../utils/cloudinary");
const router = express.Router();

// CREATE a new Barangay with dynamic folder assignment
router.post(
    "/create",
    
    async (req, res) => {
        try {
        
            const barangay = new Barangay({
                name: req.body.name,
            });

            const savedBarangay = await barangay.save();
            res.status(201).json(savedBarangay);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// READ all Barangays
router.get("/", async (req, res) => {
    try {
        const barangays = await Barangay.find();
        res.status(200).json(barangays);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// READ a specific Barangay by ID
router.get("/:id", async (req, res) => {
    try {
        const barangay = await Barangay.findById(req.params.id);
        if (!barangay)
            return res.status(404).json({ message: "Barangay not found" });
        res.status(200).json(barangay);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// UPDATE a Barangay with dynamic folder assignment
router.put(
    "/update/:id",
    async (req, res) => {
        try {
            const updatedBarangay = await Barangay.findByIdAndUpdate(
                req.params.id,
                {
                    name: req.body.name,
                },
                { new: true }
            );

            if (!updatedBarangay)
                return res
                    .status(404)
                    .json({ message: "Barangay not found" });
            res.status(200).json(updatedBarangay);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// DELETE a Barangay
router.delete("/delete/:id", async (req, res) => {
    try {
        const barangay = await Barangay.findByIdAndRemove(req.params.id);
        if (!barangay)
            return res
                .status(404)
                .json({ message: "Barangay not found" });

        res
            .status(200)
            .json({ success: true, message: "Barangay deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
