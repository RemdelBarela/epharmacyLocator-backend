const express = require('express');
const { Medicine } = require('../models/medicine');
const { Pharmacy } = require('../models/pharmacy');
const { MedicationCategory } = require('../models/medication-category');
const router = express.Router();

// medicine per category chart
router.get('/medicinesPerCategory', async (req, res) => {
    try {
        const categories = await MedicationCategory.aggregate([
            {
                $lookup: {
                    from: 'medicines',
                    localField: '_id',
                    foreignField: 'category',
                    as: 'medicines'
                }
            },
            {
                $project: {
                    name: 1,
                    count: { $size: '$medicines' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching medicines per category' });
    }
});
// Create Medicine
router.post('/create', async (req, res) => {
    const { name, stock, pharmacy, category } = req.body;
    console.log(req.body)

    // Validate if pharmacy exists
    const pharmacyExists = await Pharmacy.findOne({ userInfo: pharmacy });
    if (!pharmacyExists) return res.status(400).send("Invalid Pharmacy ID");

    // Find category by name, case-insensitive
    const categoryExists = await MedicationCategory.findOne({ name: category });
    if (!categoryExists) return res.status(400).send("Invalid Category name");

    // Create new medicine document
    let medicine = new Medicine({
        name,
        timeStamps: new Date(),  // This will store the current date and time
        stock,
        pharmacy: pharmacyExists._id,
        category: categoryExists._id,
    });
    
    console.log(medicine)

    try {
        // Save the medicine document to the database
        medicine = await medicine.save();
        res.send(medicine); // Return the saved medicine
    } catch (err) {
        // Handle any errors during the save process
        res.status(500).send('The medicine cannot be created');
    }
});


//PHARMACY
// Read Medicines (Get All)
router.get('/', async (req, res) => {
    try {
        // Find all medicines where pharmacy.userInfo matches the id parameter
        const medicines = await Medicine.find()
            .populate({
                path: 'pharmacy',
                populate: {
                    path: 'userInfo',
                    select: 'name street barangay city contactNumber',
                },
            })
            .populate('category');

        // Filter out medicines where pharmacy is null (no match for userInfo)
        const filteredMedicines = medicines.filter(med => med.pharmacy !== null);
        res.status(200).send(filteredMedicines);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get All Pharmacy's Medicine
router.get('/:id', async (req, res) => {
    try {
        // Find the pharmacy by the userInfo field (params.id)
        const pharmacy = await Pharmacy.findOne({ userInfo: req.params.id });

        // If no pharmacy is found, return an error
        if (!pharmacy) {
            return res.status(400).send("Pharmacy not found");
        }

        // Find all medicines where the pharmacy field matches the pharmacy ID
        const medicines = await Medicine.find({ pharmacy: pharmacy._id })
            .populate('category')
            .populate('pharmacy');

        // Send the fetched medicines
        res.status(200).send(medicines);
    } catch (error) {
        // Handle errors
        res.status(500).json({ success: false, message: error.message });
    }
});


//Get Single Medicine
router.get('/read/:id', async (req, res) => {
    try {
        // Find all medicines where the pharmacy field matches the given pharmacy ID
        const medicines = await Medicine.findById(req.params.id)
            .populate('category')
            .populate('pharmacy');

        // Send the fetched medicines
        res.status(200).send(medicines);
    } catch (error) {
        // Handle errors
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update Medicine
router.put('/update/:id', async (req, res) => {
    const { stock } = req.body;  // Only extracting the stock from the body

    // Validate the input stock if needed
    if (stock === undefined) return res.status(400).send("Stock value is required");

    try {
        // Find the medicine and update only the stock field
        const updatedMedicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            {
                stock,
                timeStamps: new Date(),  
            },
            { new: true }  // Return the updated document
        );

        // Check if the medicine was updated
        if (!updatedMedicine) return res.status(500).json({ message: 'The medicine cannot be updated' });

        res.send(updatedMedicine);  // Send the updated medicine details
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// Delete Medicine
router.delete('/delete/:id', async (req, res) => {
    try {
        const medicine = await Medicine.findByIdAndRemove(req.params.id);
        if (!medicine) return res.status(404).json({ message: 'Medicine not found!' });

        res.status(200).json({ success: true, message: 'The medicine is deleted!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err });
    }
});

//Get Available Pharmacy Medicine
router.get('/available/:name', async (req, res) => {
    const { name } = req.params;  // Extract name from path
    console.log('Received name:', name);  // Log to check

    // Query the database or filter the medicines based on name
    const medicines = await Medicine.find({
        name: { $regex: new RegExp(`^${name}$`, 'i') }
    }).populate('category')
        .populate({
            path: 'pharmacy',
            populate: {
                path: 'userInfo',
                select: 'name street barangay city contactNumber',
            },
        })

    if (medicines.length === 0) {
        return res.status(404).json({ success: false, message: 'No medicines found' });
    }

    res.status(200).json(medicines);
});


module.exports = router;


