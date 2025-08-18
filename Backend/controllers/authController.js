// excel-analytics-backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAction } = require('../utils/historyUtils'); // Import the new utility

exports.register = async (req, res) => {
    try {
        console.log("Received Request Body:", req.body);
        const { name, email, password, isAdmin } = req.body;

        if (!name || !email || !password) {
            // Log missing fields error
            await logAction('anonymous', `Registration Failed: Missing fields for ${email || 'N/A'}`);
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Log user already exists error
            await logAction('anonymous', `Registration Failed: User already exists - ${email}`);
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Save user to database
        const user = new User({ name, email, password: hashedPassword, isAdmin });
        await user.save();

        // Log successful registration action with the new user's ID
        await logAction(user._id, `User Registered: ${email}`);

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error("Registration failed:", error); // Log internal error for debugging
        // Log general registration failure
        await logAction('anonymous', `Registration Failed: Server error for ${req.body.email || 'N/A'} - ${error.message}`);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            await logAction('anonymous', `Login Failed: Missing credentials for ${email || 'N/A'}`);
            return res.status(400).json({ message: "Missing email or password" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            await logAction('anonymous', `Login Failed: User not found - ${email}`);
            return res.status(400).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await logAction(user._id, `Login Failed: Invalid credentials for ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token securely
        const token = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin, username: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Log successful login action with the user's ID
        await logAction(user._id, `User logged in: ${user.email}`);

        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        console.error("Login failed:", error); // Log internal error for debugging
        await logAction('anonymous', `Login Failed: Server error for ${req.body.email || 'N/A'} - ${error.message}`);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};