const express = require("express");
const { MedicationCategory } = require("../models/medication-category");
const { Medicine } = require("../models/medicine");
const { PharmacyStock } = require("../models/pharmacyStock");

const { uploadOptions } = require("../utils/cloudinary");
const router = express.Router();

router.post("/create", async (req, res) => {

    let medicationCategory = new MedicationCategory({
        name: req.body.name,
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


router.put("/update/:id", async (req, res) => {
   
    const updatedCategory = await MedicationCategory.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
        },
        { new: true }
    );

    if (!updatedCategory) {
        return res.status(500).json({ message: "The medication category cannot be updated." });
    }

    res.send(updatedCategory);
});



router.delete('/delete/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;

        const medicationCategory = await MedicationCategory.findById(categoryId);
        if (!medicationCategory) {
            return res.status(404).json({ success: false, message: 'Medication category not found!' });
        }

        const medicines = await Medicine.find({ category: categoryId });

        const medicineIds = medicines.map(med => med._id);

        await PharmacyStock.deleteMany({ medicine: { $in: medicineIds } });

        await Medicine.deleteMany({ category: categoryId });

        await MedicationCategory.findByIdAndRemove(categoryId);

        return res.status(200).json({ success: true, message: 'Medication category, related medicines, and pharmacy stock deleted successfully!' });

    } catch (error) {
        console.error('Error deleting medication category:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
