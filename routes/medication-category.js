const express = require("express");
const { MedicationCategory } = require("../models/medication-category");
const { uploadOptions } = require("../utils/cloudinary");
const router = express.Router();

// Create a medication category with image upload
router.post("/create", (req, res, next) => {
    req.folder = "medicationcategory"; // Set the folder name
    next();
}, uploadOptions.array("images", 10), async (req, res) => {
    const files = req.files;
    let imagePaths = [];

    if (files) {
        imagePaths = files.map((file) => file.path); // Cloudinary URLs
    }

    let medicationCategory = new MedicationCategory({
        name: req.body.name,
        description: req.body.description,
        images: imagePaths,
    });

    try {
        medicationCategory = await medicationCategory.save();
        res.send(medicationCategory);
    } catch (err) {
        res.status(400).send("The medication category cannot be created!");
    }
});



router.get('/', async (req, res) => {
    const medicationCategories = await MedicationCategory.find();

    if (!medicationCategories) {
        return res.status(500).json({ success: false });
    }

    res.send(medicationCategories);
});

router.get('/:id', async (req, res) => {
    const medicationCategory = await MedicationCategory.findById(req.params.id);

    if (!medicationCategory) {
        return res.status(500).json({ message: 'The medication category with the given ID was not found.' });
    }

    res.status(200).send(medicationCategory);
});


router.put("/update/:id", (req, res, next) => {
    req.folder = "medicationcategory"; // Set the folder name
    next();
}, uploadOptions.array("images", 10), async (req, res) => {
    const files = req.files;
    let imagePaths = [];

    if (files) {
        imagePaths = files.map((file) => file.path); // Cloudinary URLs
    }

    const updatedCategory = await MedicationCategory.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            images: imagePaths.length ? imagePaths : undefined,
        },
        { new: true }
    );

    if (!updatedCategory) {
        return res.status(500).json({ message: "The medication category cannot be updated." });
    }

    res.send(updatedCategory);
});



router.delete('/delete/:id', async (req, res) => {
    MedicationCategory.findByIdAndRemove(req.params.id)
        .then((medicationCategory) => {
            if (medicationCategory) {
                return res.status(200).json({ success: true, message: 'The medication category is deleted!' });
            } else {
                return res.status(404).json({ success: false, message: 'Medication category not found!' });
            }
        })
        .catch((err) => {
            return res.status(500).json({ success: false, error: err });
        });
});

module.exports = router;
