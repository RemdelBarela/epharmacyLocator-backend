const express = require('express');
const { User } = require('../models/user');
const { Medicine } = require('../models/medicine');
const { PharmacyStock } = require('../models/pharmacyStock');
const { Pharmacy } = require('../models/pharmacy');
const { MedicationCategory } = require('../models/medication-category');
const router = express.Router();
const fs = require('fs');
const path = require('path');


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


// JSON MEDICINES
router.get('/json', (req, res) => {
    const filePath = path.join(__dirname, '../utils/medicines.json');

    const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });

    res.setHeader('Content-Type', 'application/json');

    readStream.on('error', (err) => {
        res.status(500).json({ success: false, message: err.message });
    });

    readStream.pipe(res);
});

// ADMIN
// Read Medicines (Get All)
router.get('/', async (req, res) => {
    try {
        // Find all medicines where pharmacy.userInfo matches the id parameter
        const medicines = await Medicine.find()
            .populate('category', 'name')
            .lean();

        res.status(200).send(medicines);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Read
router.get('/admin/read/:id', async (req, res) => {
    try {
        const medicineId = req.params.id;

        // Find all stock records that contain the given medicine ID
        const medicine = await PharmacyStock.find({ medicine: medicineId })
            .populate({
                path: 'medicine',
                populate: {
                    path: 'category', // Populate category inside medicine
                }
            })
            .populate({
                path: 'pharmacy',
                populate: {
                    path: 'userInfo', // Populate category inside medicine
                }
            })
            .lean();

        res.status(200).json(medicine);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete Medicine
router.delete('/admin/delete/:id', async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) return res.status(404).json({ message: 'Medicine not found!' });

        // Delete related records
        await PharmacyStock.deleteMany({ medicine: req.params.id });

        // Finally, delete the medicine itself
        await Medicine.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'Medicine and related data deleted!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


// PHARMACY
// Create Medicine
router.post('/create', async (req, res) => {
    try {
        const { brandName, genericName, dosageStrength, dosageForm,
            classification, expirationPerStock, pharmacy, category, description } = req.body;

        console.log("Incoming Data:", req.body);

        // Validate if pharmacy exists
        const pharmacyExists = await Pharmacy.findOne({ userInfo: pharmacy });
        if (!pharmacyExists) return res.status(400).send("Invalid Pharmacy ID");

        // Process categories (Ensure category is treated correctly)
        const categoryNames = category
            .split('/') // Split categories by '/'
            .map(name => name.trim().replace(/\s+/g, ' ')); // Normalize spaces

        const categoryIds = [];

        for (let categoryName of categoryNames) {
            categoryName = categoryName.replace(/[.*+?^${}|[\]\\]/g, '\\$&');

            let categoryExists = await MedicationCategory.findOne({
                name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
            });

            if (!categoryExists) {
                const newCategory = new MedicationCategory({ name: categoryName });
                await newCategory.save();
                categoryExists = newCategory;
            }

            categoryIds.push(categoryExists._id);
        }



        // Find or create the medicine
        let medicineExists = await Medicine.findOne({
            genericName,
            brandName,
            dosageForm,
            dosageStrength,
            classification,
            category: categoryIds,
            description
        });

        if (!medicineExists) {
            const medicine = new Medicine({
                genericName,
                brandName,
                dosageForm,
                dosageStrength,
                classification,
                category: categoryIds,
                description
            });
            await medicine.save();
            medicineExists = medicine;
        }


        // Ensure expirationDate remains in "YYYY-MM-DD" format
        const formattedExpirationPerStock = expirationPerStock.map(item => ({
            stock: Number(item.stock), // Convert stock to number
            expirationDate: new Date(item.expirationDate) // Keep it as a string
        }));


        // Create stock entry
        let pharmacyStock = new PharmacyStock({
            medicine: medicineExists._id,
            expirationPerStock: formattedExpirationPerStock,
            pharmacy: pharmacyExists._id,
            timeStamps: new Date(),
        });

        await pharmacyStock.save();
        res.status(201).send(pharmacyStock);

    } catch (error) {
        console.error('Error saving stock:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Get All Pharmacy's Medicine
router.get('/:id', async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findOne({ userInfo: req.params.id });

        if (!pharmacy) {
            return res.status(400).send("Pharmacy not found");
        }

        const stock = await PharmacyStock.find({ pharmacy: pharmacy._id })
            .populate({
                path: 'medicine',
                populate: { path: 'category' },
            })
            .populate('pharmacy')
            .lean();

        const today = new Date();
        let updatedStocks = [];

        for (let item of stock) {
            let updatedExpirationPerStock = item.expirationPerStock.map(exp => {
                // Convert expirationDate from "MMMM, dd, yyyy" (e.g., "March, 03, 2025") to Date
                let expDate = new Date(exp.expirationDate); 

                // Check if conversion was successful
                if (isNaN(expDate)) {
                    const parts = exp.expirationDate.split(', ').map(p => p.trim());
                    if (parts.length === 3) {
                        expDate = new Date(`${parts[0]} ${parts[1]}, ${parts[2]}`);
                    }
                }

                // Set stock to 0 if expired
                if (!isNaN(expDate) && expDate < today) {
                    return { ...exp, stock: 0 };
                }
                return exp;
            });

            // Update timestamp as a string (formatted "YYYY-MM-DD HH:mm:ss")
            const updatedTimeStamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

            // Update the document
            await PharmacyStock.findByIdAndUpdate(item._id, { 
                expirationPerStock: updatedExpirationPerStock,
                timeStamps: updatedTimeStamp
            });

            // Update response data
            item.expirationPerStock = updatedExpirationPerStock;
            item.timeStamps = updatedTimeStamp;
            updatedStocks.push(item);
        }

        res.status(200).send(updatedStocks);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


router.get('/features/:id', async (req, res) => {
    try {
        // Find the pharmacy by its ID and include the userInfo field
        const pharmacy = await Pharmacy.findById(req.params.id);

        if (!pharmacy) {
            return res.status(400).json({ success: false, message: "Pharmacy not found" });
        }

        // Find the stock for the pharmacy
        const stock = await PharmacyStock.find({ pharmacy: req.params.id })
            .populate({
                path: 'medicine',
                populate: { path: 'category' },
            })
            .lean();

        // Send response including userInfoId and stock
        res.status(200).json(stock);
    } catch (error) {
        console.error("Error fetching pharmacy stock:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/category/:id', async (req, res) => {
    try {
        // Find the pharmacy by its ID and include the userInfo field
        const category = await MedicationCategory.findById(req.params.id);

        if (!category) {
            return res.status(400).json({ success: false, message: "Category not found" });
        }

        const medicine = await Medicine.find({ category: req.params.id })
        .populate('category')
        .lean();
    
        res.status(200).json(medicine);
    } catch (error) {
        console.error("Error fetching medicine:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});


// Existing Medicines
router.get('/existing/:pharmacyId/:genericName', async (req, res) => {
    try {
        const { pharmacyId, genericName } = req.params;

        // Find the pharmacy using pharmacyId
        const pharmacy = await Pharmacy.findOne({ userInfo: pharmacyId });

        if (!pharmacy) {
            return res.status(400).send("Pharmacy not found");
        }

        // Find stock in that pharmacy filtered by genericName
        const stock = await PharmacyStock.find({ pharmacy: pharmacy._id })
            .populate({
                path: 'medicine',
                match: { genericName: genericName }, // Filter medicines by genericName
            })
            .lean();

        // Filter out null medicines (if no match is found in populate)
        const filteredStock = stock.filter(item => item.medicine);

        res.json(filteredStock);
    } catch (error) {
        console.error('Error fetching medicines:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get Single Medicine
router.get('/read/:id', async (req, res) => {
    try {
        // Find all medicines where the pharmacy field matches the given pharmacy ID
        const stock = await PharmacyStock.findById(req.params.id)
            .populate({
                path: 'medicine',
                populate: {
                    path: 'category', // Populate category inside medicine
                }
            })
            .populate('pharmacy')
            .lean();

        // Send the fetched medicines
        res.status(200).send(stock);
    } catch (error) {
        // Handle errors
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update Medicine Stock
router.put('/update/:id', async (req, res) => {
    const { expirationPerStock } = req.body; // Extracting the full array

    // Validate input
    if (!Array.isArray(expirationPerStock) || expirationPerStock.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid expirationPerStock data" });
    }

    try {
        // Find and update only the expirationPerStock field
        const updatedStock = await PharmacyStock.findByIdAndUpdate(
            req.params.id,
            {
                $set: { expirationPerStock },  // Update entire array
                updatedAt: new Date(),  // Ensure timestamps update
            },
            { new: true, runValidators: true } // Return updated document & validate input
        );

        if (!updatedStock) {
            return res.status(404).json({ success: false, message: "Stock record not found" });
        }

        res.json({ success: true, data: updatedStock });
    } catch (err) {
        console.error('Error updating stock:', err.message);
        res.status(500).json({ success: false, message: "Failed to update stock", error: err.message });
    }
});

// Delete Medicine Stock
router.delete('/delete/:id', async (req, res) => {
    try {
        const stock = await PharmacyStock.findByIdAndRemove(req.params.id);
        if (!stock) return res.status(404).json({ message: 'Medicine not found!' });

        res.status(200).json({ success: true, message: 'The medicine is deleted!' });
    } catch (err) {
        res.status(500).json({ success: false, error: err });
    }
});

// Get pharmacies that stock specific medicines
router.post('/with-medicines', async (req, res) => {
    try {
        console.log("Incoming request body:", req.body); // Debugging log

        const { medicineNames } = req.body;
        if (!medicineNames || !Array.isArray(medicineNames) || medicineNames.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid medicine list' });
        }

        // Find medicines by generic name
        const medicines = await Medicine.find({
            genericName: { $in: medicineNames.map(name => new RegExp(`^${name}$`, 'i')) }
        });

        if (!medicines.length) {
            return res.status(404).json({ success: false, message: 'No medicines found' });
        }

        // Extract medicine IDs
        const medicineIds = medicines.map(med => med._id);

        // Find pharmacy stocks that have these medicines
        const pharmacyStocks = await PharmacyStock.find({ medicine: { $in: medicineIds } })
            .populate({
                path: 'pharmacy',
                populate: { path: 'userInfo', select: 'name street barangay city contactNumber' }
            })
            .populate({
                path: 'medicine',
                select: 'genericName brandName dosageStrength dosageForm classification'
            });

        if (!pharmacyStocks.length) {
            return res.status(404).json({ success: false, message: 'No pharmacies found with the requested medicines' });
        }

        // Group by pharmacy
        const pharmaciesMap = new Map();
        pharmacyStocks.forEach((stock) => {
            if (stock.pharmacy) {
                const pharmacyId = stock.pharmacy._id.toString();
                if (!pharmaciesMap.has(pharmacyId)) {
                    pharmaciesMap.set(pharmacyId, {
                        pharmacy: stock.pharmacy,
                        medicines: [],
                    });
                }
                pharmaciesMap.get(pharmacyId).medicines.push({
                    genericName: stock.medicine.genericName,
                    brandName: stock.medicine.brandName,
                    stock: stock.expirationPerStock.reduce((total, entry) => total + entry.stock, 0),
                    expirationPerStock: stock.expirationPerStock,
                });
            }
        });

        res.status(200).json({ success: true, data: Array.from(pharmaciesMap.values()) });
    } catch (error) {
        console.error("Backend error:", error);
        res.status(500).json({ success: false, message: 'Error fetching pharmacies with medicines', error: error.message });
    }
});

//Get Available Pharmacy Medicine
router.get('/available/:name', async (req, res) => {
    try {
        const { name } = req.params;
        console.log('Received name:', name);

        // Find all medicines that match the generic name (case-insensitive)
        const medicines = await Medicine.find({
            genericName: name 
        });

        if (medicines.length === 0) {
            return res.status(404).json({ success: false, message: 'No medicines found for this generic name' });
        }

        // Extract medicine IDs
        const medicineIds = medicines.map(med => med._id);

        // Find all pharmacy stocks related to the medicines
        let pharmacyStocks = await PharmacyStock.find({ medicine: { $in: medicineIds } })
            .populate({
                path: 'pharmacy',
                populate: {
                    path: 'userInfo',
                    select: 'name street barangay city contactNumber',
                },
            })
            .populate({
                path: 'medicine',
                populate: {
                    path: 'category',
                },
            })
            .lean();

        if (pharmacyStocks.length === 0) {
            return res.status(404).json({ success: false, message: 'No pharmacy stocks found for this medicine' });
        }

        // ✅ Calculate total stock and find the latest timeStamps
        let totalStock = 0;
        let latestTimestamp = null;

        pharmacyStocks.forEach(stock => {
            // Add to total stock
            if (stock.expirationPerStock) {
                stock.expirationPerStock.forEach(exp => {
                    totalStock += exp.stock;
                });
            }

            // Get the latest timeStamps
            const stockTimestamp = new Date(stock.timeStamps);
            if (!latestTimestamp || stockTimestamp > latestTimestamp) {
                latestTimestamp = stockTimestamp;
            }
        });

        console.log(`Total stock for ${name}:`, totalStock);
        console.log(`Latest timestamp:`, latestTimestamp);

        // ✅ Filter to get unique pharmacies while keeping all expiration data
        const uniquePharmacies = new Map();
        pharmacyStocks.forEach(stock => {
            const pharmacyId = stock.pharmacy._id.toString();

            if (!uniquePharmacies.has(pharmacyId)) {
                uniquePharmacies.set(pharmacyId, {
                    pharmacy: stock.pharmacy,
                    medicine: stock.medicine,
                    totalStock: 0,
                    expirationPerStock: [],
                    timeStamps: stock.timeStamps
                });
            }

            const pharmacyData = uniquePharmacies.get(pharmacyId);
            pharmacyData.totalStock += stock.expirationPerStock?.reduce((sum, item) => sum + item.stock, 0) || 0;
            pharmacyData.expirationPerStock.push(...stock.expirationPerStock);
        });

        res.status(200).json({ 
            success: true, 
            totalStock, 
            latestTimestamp, 
            data: Array.from(uniquePharmacies.values()) 
        });

    } catch (error) {
        console.error('Error fetching available medicine:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});


// Available Different brands and dosages based on the generic name
router.get('/list/:pharmacyId/:genericName', async (req, res) => {
    try {
        const { pharmacyId, genericName } = req.params;
        console.log('Received:', { pharmacyId, genericName });

        // Find all medicines that match the generic name (case-insensitive)
        const medicines = await Medicine.find({
            genericName: genericName
        });

        if (medicines.length === 0) {
            return res.status(404).json({ success: false, message: 'No medicines found for this generic name' });
        }

        // Extract medicine IDs
        const medicineIds = medicines.map(med => med._id);

        // Find pharmacy stocks filtered by medicine and pharmacy
        const pharmacyStocks = await PharmacyStock.find({
            medicine: { $in: medicineIds }, // Match any medicine with the generic name
            pharmacy: pharmacyId // Ensure stock is from the given pharmacy
        })
            .populate({
                path: 'pharmacy',
                populate: {
                    path: 'userInfo',
                    select: 'name street barangay city contactNumber',
                },
            })
            .populate({
                path: 'medicine',
                populate: {
                    path: 'category',
                },
            })
            .lean();

        if (pharmacyStocks.length === 0) {
            return res.status(404).json({ success: false, message: 'No pharmacy stocks found for this medicine at the given pharmacy' });
        }

        res.status(200).json({ success: true, data: pharmacyStocks });

    } catch (error) {
        console.error('Error fetching available medicine:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;


