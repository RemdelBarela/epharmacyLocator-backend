const express = require("express");
const { Prescription } = require("../models/prescription");

const router = express.Router();

// GET total count of prescriptions
router.get("/", async (req, res) => {
    try {
        const count = await Prescription.countDocuments();
        res.status(200).json({ totalPrescriptions: count });
    } catch (error) {
        console.error("Error counting prescriptions:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
