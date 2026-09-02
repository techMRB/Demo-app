import User from '../model/user.js';
import axios from 'axios';
import { sendEmail } from '../utils/email.js';
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
// Create a new user
export const createUser = async (req, res) => {
    try {
        const { user_password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user_password, salt);
        req.body.user_password = hashedPassword;
        const token = jwt.sign(
            { email: req.body.user_email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        const user = await User.create(req.body);
        if (user) {
            const subject = "Welcome to Demo App - Please Verify Your Email";
            const html = `
                <p>Hello ${user.user_name},</p>
                <p>Welcome to the Demo App.<p/> 
                <p>Please verify your email by clicking the button below:</p>
                <a href="http://localhost:3000/verify-email/${token}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Verify Email</a>
                <p>This token will expire in 24 hours.</p>
                <p>Thank you for joining us!</p>
                <p>Best regards,<br>Demo App Team</p>
            `;
            await sendEmail(user.user_email, subject, html);
        }
        res.status(201).json(user);
    } catch (error) {
        console.log("Error creating user", error);
        res.status(500).json({ message: "Error creating user", errorCode: "USER_CREATE_ERROR" });
    }
}

//verify user email
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ user_email: decoded.email });
        if (!user) {
            return res.status(404).json({ message: "User not found", errorCode: "USER_NOT_FOUND" });
        }
        user.isVerified = true;
        await user.save();
        res.status(200).json({ message: "Email verified successfully!", errorCode: "EMAIL_VERIFY_SUCCESS" });
    } catch (error) {
        console.log("Error verifying email", error);
        res.status(500).json({ message: "Error verifying email", errorCode: "EMAIL_VERIFY_ERROR" });
    }
}

//get all users
export const getAllUsers = async (req, res) => {

    try {
        const allusers = await User.find();
        res.status(200).json(allusers);
    } catch (error) {
        console.log("Error fetching users", error);
        res.status(500).json({ message: "Error fetching users", errorCode: "USER_FETCH_ERROR" });
    }
}

//get user by id
export const getUserById = async (req, res) => {
    try {
        console.log(req);
        const userdetails = await User.findById(req.params.id);
        if (!userdetails) {
            res.status(404).json({ message: "User not found", errorCode: "USER_NOT_FOUND" });
        }
        res.status(200).json({ message: "User found!", user: userdetails });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user details", errorCode: "USER_FETCH_ERROR" });
    }
}

//updat user details
export const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) {
            res.status(404).json({ message: "User not found", errorCode: "USER_NOT_FOUND" });
        }
        res.status(200).json({ message: "User updated successfully!", user: user });
    } catch (error) {
        res.status(500).json({ message: "Error updating user details", errorCode: "USER_UPDATE_ERROR" });
    }
}

export const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['user', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role value", errorCode: "INVALID_ROLE" });
        }
        if(req.params.id === req.user.id) {
            return res.status(400).json({ message: "You cannot change your own role", errorCode: "SELF_ROLE_CHANGE" });
        }
       
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found", errorCode: "USER_NOT_FOUND" });
        }
        user.userRole = role;
        await user.invalidateSessions(); 
        return res.status(200).json({ message: "User role updated successfully!", user: user });
    } catch (error) {
        res.status(500).json({ message: "Error updating user role", errorCode: "ROLE_UPDATE_ERROR" });
    }
}

// delete user
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            res.status(404).json({ message: "User not found", errorCode: "USER_NOT_FOUND" });
        }
        res.status(200).json({ message: "User deleted successfully!", user: user });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", errorCode: "USER_DELETE_ERROR" });
    }
}

