const { User } = require('../models/user');
const express = require('express');
const { Pharmacy } = require('../models/pharmacy');
const router = express.Router();
const nodemailer = require('nodemailer');
const { PharmacyStock } = require('../models/pharmacyStock');
const { checkExpiringStocks } =require('../utils/cronJobs')
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const mongoose = require('mongoose');


let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },

})
//chart
router.get('/pharmaciesPerBarangay', async (req, res) => {
  try {
    const pharmaciesByBarangay = await Pharmacy.aggregate([
      {
        $lookup: {
          from: 'users', // Collection name for the referenced User schema
          localField: 'userInfo',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      {
        $unwind: '$userInfo',
      },
      {
        $group: {
          _id: '$userInfo.barangay',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          barangay: '$_id',
          count: 1,
        },
      },
      {
        $sort: { barangay: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: pharmaciesByBarangay,
    });
  } catch (error) {
    console.error('Error fetching pharmacies per barangay:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching data.',
    });
  }
});

// PHARMACY JSON
router.get('/json', (req, res) => {
  const filePath = path.join(__dirname, '../utils/pharmacies.json');

  const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });

  res.setHeader('Content-Type', 'application/json');

  readStream.on('error', (err) => {
      res.status(500).json({ success: false, message: err.message });
  });

  readStream.pipe(res);
});

// GET all pharmacies with userInfo populated
router.get('/', async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find()
      .populate({
        path: 'userInfo',  // Populate userInfo field
        select: 'name contactNumber street barangay city'
      });

    if (!pharmacies) {
      return res.status(500).json({ success: false, message: 'No pharmacies found' });
    }

    res.status(200).json(pharmacies);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pharmacyId = req.params.id;
    const pharmacy = await Pharmacy.findById(pharmacyId).populate({
      path: 'userInfo',
      select: 'email name contactNumber street barangay city', // Populate specific fields
    });

    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Pharmacy not found' });
    }

    res.status(200).json(pharmacy);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/approved/:id', async (req, res) => {
  try {
    // Update the pharmacy approval status
    const approvedPharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      {
        approved: true,
      },
      { new: true }
    );

    if (!approvedPharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    // Get the pharmacy owner's user information
    const pharmacyOwner = await User.findById(approvedPharmacy.userInfo);
    if (!pharmacyOwner) {
      return res.status(404).json({ message: "Pharmacy owner not found" });
    }

    // Send approval email to the pharmacy owner
    const mailOptions = {
      from: process.env.AUTH_EMAIL, // Sender address
      to: pharmacyOwner.email, // Receiver's email (Pharmacy Owner)
      subject: "YOUR PHARMACY IS NOW APPROVED", // Subject
      html: `<p>Dear ${pharmacyOwner.name},</p>
                 <p>Your pharmacy has been approved! We reviewed your business permits and validated them.</p>
                 <p>Congratulations on being officially approved!</p>
                 <p>Best regards,</p>
                 <p>Admins</p>`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Approval email sent successfully.");

    // Respond with the updated pharmacy information
    res.status(200).json(approvedPharmacy);

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/run-expiry-check", async (req, res) => {
  try {
    await checkExpiringStocks();
    res.status(200).json({ message: "Expiry check executed successfully" });
  } catch (error) {
    console.error("Error running expiry check:", error);
    res.status(500).json({ message: "Error executing expiry check" });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findOne({ userInfo: req.params.userId });

    if (!pharmacy) {
      return res.status(404).json({ message: "No pharmacy found for this user" });
    }

    res.json(pharmacy);
  } catch (error) {
    console.error("Error fetching pharmacy by user ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//  CHARTS
router.get('/medications-per-category/:pharmacyId', async (req, res) => {
  try {
      const { pharmacyId } = req.params;

      // Find all pharmacy stocks for the given pharmacy
      const pharmacyStocks = await PharmacyStock.find({ pharmacy: pharmacyId }).populate({
          path: 'medicine',
          populate: { path: 'category', select: 'name' }, // Populate medicine category
      });

      // Object to store unique medicines per category
      const categoryCount = {};

      pharmacyStocks.forEach(stock => {
          if (stock.medicine && stock.medicine.category) {
              stock.medicine.category.forEach(cat => {
                  if (!categoryCount[cat.name]) {
                      categoryCount[cat.name] = new Set();
                  }
                  // Add unique medicine ID to the set
                  categoryCount[cat.name].add(stock.medicine.id);
              });
          }
      });

      // Convert sets to counts
      Object.keys(categoryCount).forEach(category => {
          categoryCount[category] = categoryCount[category].size;
      });

      res.json(categoryCount);
  } catch (error) {
      console.error('Error fetching medicines per category:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/expiringStock/:pharmacyId', async (req, res) => {
  try {
    const { pharmacyId } = req.params;

    // Validate pharmacyId as a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(pharmacyId)) {
        return res.status(400).json({ error: 'Invalid Pharmacy ID' });
    }

    console.log(`Fetching expiring stock for Pharmacy ID: ${pharmacyId}`);
      const today = moment().startOf('day');

      const expiringInWeek = await PharmacyStock.aggregate([
          { $unwind: "$expirationPerStock" },
          { 
              $match: { 
                  "expirationPerStock.expirationDate": { 
                      $gte: today.toDate(), 
                      $lt: moment(today).add(7, 'days').toDate() 
                  } 
              } 
          },
          { $group: { _id: null, totalStock: { $sum: "$expirationPerStock.stock" } } }
      ]);

      const expiringInMonth = await PharmacyStock.aggregate([
          { $unwind: "$expirationPerStock" },
          { 
              $match: { 
                  "expirationPerStock.expirationDate": { 
                      $gte: today.toDate(), 
                      $lt: moment(today).add(1, 'month').toDate() 
                  } 
              } 
          },
          { $group: { _id: null, totalStock: { $sum: "$expirationPerStock.stock" } } }
      ]);

      const expiringIn3Months = await PharmacyStock.aggregate([
          { $unwind: "$expirationPerStock" },
          { 
              $match: { 
                  "expirationPerStock.expirationDate": { 
                      $gte: today.toDate(), 
                      $lt: moment(today).add(3, 'months').toDate() 
                  } 
              } 
          },
          { $group: { _id: null, totalStock: { $sum: "$expirationPerStock.stock" } } }
      ]);

      const expiringIn6Months = await PharmacyStock.aggregate([
          { $unwind: "$expirationPerStock" },
          { 
              $match: { 
                  "expirationPerStock.expirationDate": { 
                      $gte: today.toDate(), 
                      $lt: moment(today).add(6, 'months').toDate() 
                  } 
              } 
          },
          { $group: { _id: null, totalStock: { $sum: "$expirationPerStock.stock" } } }
      ]);

      res.status(200).json({
          expiringInWeek: expiringInWeek[0]?.totalStock || 0,
          expiringInMonth: expiringInMonth[0]?.totalStock || 0,
          expiringIn3Months: expiringIn3Months[0]?.totalStock || 0,
          expiringIn6Months: expiringIn6Months[0]?.totalStock || 0
      });
  } catch (error) {
      console.error('Error fetching expiring stock data:', error);
      res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
