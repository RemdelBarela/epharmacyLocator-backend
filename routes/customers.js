const { User } = require('../models/user');
const { Customer } = require('../models/customer');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');

  
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


module.exports = router;