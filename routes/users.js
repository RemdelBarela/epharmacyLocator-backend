const { User } = require('../models/user');
const { Pharmacy } = require('../models/pharmacy');
const { Customer } = require('../models/customer');
const { Diseases } = require('../models/disease');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');

const { uploadOptions } = require('../utils/cloudinary');
 // Import Cloudinary upload options

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
};

// Nodemailer stuff

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
    },

})

// Route to get users
router.get('/', async (req, res) => {
    try {
        // Find all users
        const users = await User.find();

        // Add details based on role
        const usersWithDetails = await Promise.all(
            users.map(async (user) => {
                if (user.role === 'Customer') {
                    const customer = await Customer.findOne({ userInfo: user.id }).populate('disease', 'name');
                    return { ...user._doc, customerDetails: customer };
                } else if (user.role === 'PharmacyOwner') {
                    const pharmacy = await Pharmacy.findOne({ userInfo: user.id });
                    return { ...user._doc, pharmacyDetails: pharmacy };
                }
                return user._doc; // For users without additional details
            })
        );

        res.json(usersWithDetails); // Send users with details
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Error fetching users');
    }
});

// pharmacies per month na chart
router.get('/pharmaciesPerMonth', async (req, res) => {
  try {
    const getUsersPerMonth = await User.aggregate([
      {
        $match: {
          role: "PharmacyOwner", 
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: 1 }, // Count the number of pharmacies
        },
      },
      {
        $addFields: {
          month: {
            $let: {
              vars: {
                monthsInString: [
                  null,
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sept",
                  "Oct",
                  "Nov",
                  "Dec",
                ],
              },
              in: {
                $arrayElemAt: ["$$monthsInString", "$_id.month"],
              },
            },
          },
        },
      },
      { $sort: { "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: 1,
          total: 1,
        },
      },
    ]);

    console.log(getUsersPerMonth);

    if (!getUsersPerMonth || getUsersPerMonth.length === 0) {
      return res.status(404).json({
        message: "No pharmacy registrations found for the requested period.",
      });
    }

    res.status(200).json({
      success: true,
      getUsersPerMonth,
    });
  } catch (error) {
    console.error("Error fetching pharmacy registrations per month:", error);
    res.status(500).json({
      message: "An error occurred while fetching data.",
    });
  }
});

// customers per month na chart
router.get('/customersPerMonth', async (req, res) => {
    try {
      const getUsersPerMonth = await User.aggregate([
        {
          $match: {
            role: "Customer",
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total: { $sum: 1 },
          },
        },
        {
          $addFields: {
            month: {
              $let: {
                vars: {
                  monthsInString: [
                    null,
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sept",
                    "Oct",
                    "Nov",
                    "Dec",
                  ],
                },
                in: {
                  $arrayElemAt: ["$$monthsInString", "$_id.month"],
                },
              },
            },
          },
        },
        {
          $sort: {
            "_id.year": 1,  // Sort by year first
            "_id.month": 1, // Then sort by month
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year", // Include year in the response
            month: 1,
            total: 1,
          },
        },
      ]);
  
      if (!getUsersPerMonth || getUsersPerMonth.length === 0) {
        return res.status(404).json({
          message: "No customer registrations found for the requested period.",
        });
      }
  
      res.status(200).json({
        success: true,
        getUsersPerMonth,
      });
    } catch (error) {
      console.error("Error fetching customer registrations per month:", error);
      res.status(500).json({
        message: "An error occurred while fetching data.",
      });
    }
  });
  


  router.post(
    '/register',
    (req, res, next) => {
        req.folder = 'users'; // Set the folder name for Cloudinary uploads
        next();
    },
    uploadOptions.fields([
        { name: 'images', maxCount: 10 },
        { name: 'permits', maxCount: 10 },
      ]),
    
    async (req, res) => {
        console.log(req.body)
        try {
            // Validate email uniqueness
            const emailExists = await User.findOne({ email: req.body.email });
            if (emailExists) {
                return res.status(400).json({  success: false, message: 'NOT_UNIQUE_EMAIL' });
            }

            // Validate contactNumber uniqueness and max length
            const contactExists = await User.findOne({ contactNumber: req.body.contactNumber });
            if (contactExists) {
                return res.status(400).json({  success: false, message: 'NOT_UNIQUE_CONTACT_NUMBER' });
            }

            // Create and save user object
            let user = new User({
                email: req.body.email,
                passwordHash: bcrypt.hashSync(req.body.password, 10),
                isAdmin: req.body.isAdmin,
                name: req.body.name,
                contactNumber: req.body.contactNumber,
                street: req.body.street,
                barangay: req.body.barangay,
                city: req.body.city,
                role: req.body.role,
                verified: false,
            });

            user = await user.save();
            if (!user) {
                return res.status(400).send('The user cannot be created!');
            }

            // Send OTP Verification Email
            await sendOTPVerificationEmail({ _id: user.id, email: user.email });

            // Handle role-specific logic
            if (user.role === 'Customer') {
                // Handle Customer-specific logic for files
                const files = req.files?.images || []; // Ensure files is an array
                if (!files || files.length === 0) {
                  return res.status(400).send('No images in the request');
                }
                
                const imagesPaths = files.map((file) => file.path);
                

                try {
                    
                        const customer = new Customer({
                            images: imagesPaths,
                            userInfo: user.id,
                            location: {
                                latitude: req.body.latitude,
                                longitude: req.body.longitude,
                            },
                        });

                        await customer.save();

                    return res.status(201).json({ message: 'Customer created successfully', userId: user.id, });

                } catch (error) {
                    console.error(error);
                    return res.status(500).json({ message: 'Error creating customer' });
                }

            } else  if (user.role === 'PharmacyOwner') {
                const files = req.files;
                if (!files || !files.images || files.images.length === 0 || !files.permits || files.permits.length === 0) {
                    return res.status(400).send('No images or permits in the request');
                }

                const imagesPaths = files.images.map(file => file.path);
                const permitPaths = files.permits.map(file => file.path);
                const businessDays = req.body.businessDays || '';

                const formatTime = (time) => {
                    if (!time) return null;
                    const date = new Date(time);
                    let hours = date.getHours();
                    let minutes = date.getMinutes();
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12;
                    minutes = minutes < 10 ? '0' + minutes : minutes;
                    return `${hours}:${minutes}:${ampm}`;
                };

                const openingHour = formatTime(req.body.openingHour);
                const closingHour = formatTime(req.body.closingHour);

                const newPharmacy = new Pharmacy({
                    userInfo: user.id,
                    images: imagesPaths,
                    permits: permitPaths,
                    location: req.body.latitude && req.body.longitude ? {
                        latitude: req.body.latitude,
                        longitude: req.body.longitude,
                    } : undefined,
                    approved: req.body.approved,
                    businessDays,
                    openingHour,
                    closingHour,
                });

                await newPharmacy.save();


                return res.status(201).json({ message: 'Pharmacy created successfully', userId: user.id, });
            }

            return res.status(201).json({
                message: 'Registration successful',
                userId: user.id,
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: err.message });
        }
    }
);


let otpStore = {}; 

const sendOTPVerificationEmail = async ({ _id, email }) => {
    try {
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`; // Generate OTP

        const mailOptions = {
            from: process.env.AUTH_EMAIL, // Sender address
            to: email, // Receiver's email
            subject: "Verify Your Email", // Subject
            html: `<p>Enter <b>${otp}</b> in the app to verify your email address and complete signup.</p>
                   <p>This code <b>expires in 1 hour</b>.</p>`,
        };

        const hashedOTP = await bcrypt.hash(otp, 10); 

        otpStore[_id] = {
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        console.log("OTP email sent successfully.");
        return {
            status: "PENDING",
            message: "Verification OTP email sent.",
            data: { userId: _id, email },
        };
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw new Error(error.message);
    }
};

// verify otp email
router.post('/verifyOTP', async (req, res) => {
    const { userId, otp } = req.body; 
    console.log("Received OTP:", otp);
    console.log("userId:", userId);
    try {
        // Fetch the OTP record from the store using userId
        const otpRecord = otpStore[userId];

        console.log("OTP record found:", otpRecord);

        // Check if the OTP record exists
        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP not found or expired' });
        }

        // Check if the OTP has expired
        if (Date.now() > otpRecord.expiresAt) {
            // OTP expired, so we remove it from the store
            delete otpStore[userId]; 
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Compare the plain OTP with the hashed OTP
        const isValidOTP = await bcrypt.compare(otp, otpRecord.otp);
        console.log("Is OTP valid:", isValidOTP);

        // If the OTP is valid
        if (isValidOTP) {
            delete otpStore[userId];  // Remove OTP after successful verification
            await User.updateOne({ _id: userId }, { verified: true });
            
            // Send success response
            return res.json({
                status: "VERIFIED",
                message: `User email verified successfully.`,
            });
        }

        // If the OTP is invalid
        return res.status(400).json({ message: 'Invalid OTP' });
    } catch (err) {
        console.error("Error verifying OTP:", err);
        // Send a generic error response in case of any issues
        return res.status(500).json({ message: 'Error verifying OTP' });
    }
});

router.post('/reVerifyOTP', async (req, res) => {
    const { email } = req.body; // Fetch the email from the request body
    console.log("Received Email:", email); // Log the received email for debugging

    try {
        // Check if user exists with the provided email (using email, not ObjectId)
        const user = await User.findOne({ email });

        if (user) {
            // Call sendOTPResetEmail with user details
            const result = await sendOTPVerificationEmail({ _id: user._id, email: user.email });

            // Return result after sending OTP
            res.json({
                exists: true,
                userId: user._id,
                email: user.email,
                otpStatus: result.status, // Status of OTP sending
            });
        } else {
            res.json({ exists: false });
        }
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).send('Error fetching user');
    }
});

// resend verification
router.post('/resendOTPVerificationCode', async (req, res) => {
    try {
        let { userId, email } = req.body;

        if (!userId || !email) {
            throw Error("Empty user details are not allowed");
        } else {
            //delete existing records and resend
            await UserOTPVerification.deleteMany({ userId });
            sendOTPVerificationEmail({ _id: userId, email}, res);
        }
    } catch (error) {
        res.json({
            status: "FAILED",
            message: error.message,
        })
    }
})


// Login route
router.post('/login', async (req, res) => {
    console.log(req.body.email);

    try {
        const user = await User.findOne({ email: req.body.email });
        const secret = process.env.secret;

        if (!user) {
            return res.status(400).json({ success: false, message: 'EMAIL_NOT_FOUND' });
        }

        if (!user.verified) {
            return res.status(400).json({ success: false, message: 'USER_NOT_VERIFIED' });
        }

        if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
            // Generate a token
            const token = jwt.sign(
                {
                    userId: user.id,
                    isAdmin: user.isAdmin,
                    role: user.role // Include role in the token payload
                },
                secret,
                { expiresIn: '1d' }
            );

            console.log('Login Successful:', token);

            return res.status(200).json({
                success: true,
                user: { email: user.email, role: user.role }, // Include role in response
                token: token
            });
        } else {
            return res.status(400).json({ success: false, message: 'INCORRECT_PASSWORD' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ success: false, message: 'SERVER_ERROR' });
    }
});

// Get user details by ID
router.get('/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        // Fetch the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        let userDetails = { ...user._doc }; // Clone the user document

        // Fetch additional details based on the user's role
        if (user.role === 'Customer') { 
            const customer = await Customer.findOne({ userInfo: userId }).populate('disease', 'name');
            if (customer) {
                userDetails.customerDetails = customer;
            }
        } else if (user.role === 'PharmacyOwner') {
            const pharmacy = await Pharmacy.findOne({ userInfo: userId });
            if (pharmacy) {
                userDetails.pharmacyDetails = pharmacy;
            }
        }

        res.status(200).json(userDetails);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching user');
    }
});



// Change Password
router.put('/change-password', async (req, res) => {
    const { userId, oldPassword, newPassword, confirmPassword } = req.body;

    // Validate input

    console.log(userId)

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify the old password
        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'NOT_MATCH' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password hash
        user.passwordHash = hashedPassword;

        // Save the updated user
        await user.save();

        return res.status(200).json({ message: 'Password successfully updated' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Reset Password
router.post('/checkEmail', async (req, res) => {
    const { email } = req.body; // Fetch the email from the request body
    console.log("Received Email:", email); // Log the received email for debugging

    try {
        // Check if user exists with the provided email (using email, not ObjectId)
        const user = await User.findOne({ email });

        if (user) {
            // Call sendOTPResetEmail with user details
            const result = await sendOTPResetEmail({ _id: user._id, email: user.email });

            // Return result after sending OTP
            res.json({
                exists: true,
                userId: user._id,
                email: user.email,
                otpStatus: result.status, // Status of OTP sending
            });
        } else {
            res.json({ exists: false });
        }
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).send('Error fetching user');
    }
});

const sendOTPResetEmail = async ({ _id, email }) => {
    try {
        const otp = `${Math.floor(1000 + Math.random() * 9000)}`; // Generate OTP

        const mailOptions = {
            from: process.env.AUTH_EMAIL, // Sender address
            to: email, // Receiver's email
            subject: "Reset Password", // Subject
            html: `<p>Enter <b>${otp}</b> in the app to verify your intention to reset your password.</p>
                   <p>This code <b>expires in 1 hour</b>.</p>`,
        };

        const hashedOTP = await bcrypt.hash(otp, 10); 

        otpStore[_id] = {
            otp: hashedOTP,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000,
        };

        console.log("OTP Store:", otpStore);
        // Send the email
        await transporter.sendMail(mailOptions);

        console.log("OTP email sent successfully.");
        return {
            status: "PENDING",
            message: "Verification OTP email sent.",
            data: { userId: _id, email },
        };
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw new Error(error.message);
    }
};

router.post('/resetOTP', async (req, res) => {
    const { userId, otp } = req.body; 
    console.log("Received OTP:", otp);

    try {
        // Fetch the OTP record from the store using userId
        const otpRecord = otpStore[userId];

        console.log("OTP record found:", otpRecord);

        // Check if the OTP record exists
        if (!otpRecord) {
            return res.status(400).json({ message: 'OTP not found or expired' });
        }

        // Check if the OTP has expired
        if (Date.now() > otpRecord.expiresAt) {
            // OTP expired, so we remove it from the store
            delete otpStore[userId]; 
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // Compare the plain OTP with the hashed OTP
        const isValidOTP = await bcrypt.compare(otp, otpRecord.otp);
        console.log("Is OTP valid:", isValidOTP);

        // If the OTP is valid, clear the OTP record and send success response
        if (isValidOTP) {
            delete otpStore[userId];  // Remove OTP after successful verification
            return res.json({
                status: 'success',
                message: 'OTP verified successfully.',
            });
        } else {
            // If the OTP is invalid, send an error response
            return res.status(400).json({ message: 'Invalid OTP' });
        }

    } catch (err) {
        console.error("Error verifying OTP:", err);
        // Send a generic error response in case of any issues
        return res.status(500).json({ message: 'Error verifying OTP' });
    }
});


router.put('/resetPassword', async (req, res) => {
    const { userId, newPassword, confirmPassword } = req.body;

    console.log('userid', req.body)
    // Validate input
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Password fields are required' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password hash
        user.passwordHash = hashedPassword;

        // Save the updated user
        await user.save();

        return res.status(200).json({ message: 'Password successfully updated' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Edit Profile Route
router.put('/:id', uploadOptions.array('images'), async (req, res) => {
    const { id } = req.params;
    const { name, contactNumber, street, barangay, city } = req.body;

    try {
        // Check if the user is an Admin
        const admin = await User.findById(id);
        if (admin && admin.role === 'Admin') {
            // Update Admin fields
            admin.name = name || admin.name;
            admin.contactNumber = contactNumber || admin.contactNumber;
            admin.street = street || admin.street;
            admin.barangay = barangay || admin.barangay;
            admin.city = city || admin.city;
            await admin.save();
            return res.status(200).json({ message: 'Admin profile updated successfully', admin });
        }

        // If not admin, check if the user is a Customer or Pharmacy
        const customer = await Customer.findOne({ userInfo: id }).populate('userInfo');
        const pharmacy = await Pharmacy.findOne({ userInfo: id }).populate('userInfo');

        if (!customer) {
            if (!pharmacy) return res.status(404).send('Entity not found');

            // Update User and Pharmacy fields
            if (pharmacy.userInfo) {
                const user = pharmacy.userInfo;
                user.name = name || user.name;
                user.contactNumber = contactNumber || user.contactNumber;
                user.street = street || user.street;
                user.barangay = barangay || user.barangay;
                user.city = city || user.city;
                await user.save();
            }

            // Check if images were uploaded
            const imageUrls = req.files.map((file) => file.path);
            if (imageUrls.length > 0) {
                pharmacy.images = imageUrls; // New images are set if any
            } else if (req.body.existingImages) {
                try {
                    pharmacy.images = JSON.parse(req.body.existingImages); // Retain old images if no new ones
                } catch (e) {
                    console.error('Error parsing existing images:', e);
                    return res.status(400).send('Invalid format for existing images');
                }
            }
            

            await pharmacy.save();
            return res.status(200).json({ message: 'Pharmacy updated successfully', pharmacy });
        }

        if (customer.userInfo) {
            const user = customer.userInfo;
            user.name = name || user.name;
            user.contactNumber = contactNumber || user.contactNumber;
            user.street = street || user.street;
            user.barangay = barangay || user.barangay;
            user.city = city || user.city;
            await user.save();
        }

        const imageUrls = req.files.map((file) => file.path);
        if (imageUrls.length > 0) {
            customer.images = imageUrls; // New images
        } else if (req.body.existingImages) {
            customer.images = JSON.parse(req.body.existingImages); // Retain old images
        }

        await customer.save();

        res.status(200).json({ message: 'Customer profile updated successfully', customer });
    } catch (error) {
        console.error('Error updating entity:', error);
        res.status(500).send('Error updating entity');
    }
});


  

module.exports = router;