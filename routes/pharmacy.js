const { User } = require('../models/user');
const express = require('express');
const { Pharmacy } = require('../models/pharmacy');
const router = express.Router();
const nodemailer = require('nodemailer');

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
module.exports = router;
