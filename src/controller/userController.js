import User from '../model/user.js';
import axios from 'axios';
import { sendEmail } from '../utils/email.js';
import bcrypt from "bcrypt"

// Create a new user
export const createUser = async (req, res) => {
    try {
        const { user_password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user_password, salt);
        req.body.user_password = hashedPassword;
        const user = await User.create(req.body);
        if (user) {
            const subject = "Welcome to Demo App - Please Verify Your Email";
            const html = `
                <p>Hello ${user.user_name},</p>
                <p>Welcome to the Demo App.<p/> 
                <p>Please verify your email by clicking the button below:</p>
                <a href="http://localhost:5000/api/users/register" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Verify Email</a>
                <p>This token will expire in 24 hours.</p>
                <p>Thank you for joining us!</p>
                <p>Best regards,<br>Demo App Team</p>
            `;
            await sendEmail(user.user_email, subject, html);
        }
        res.status(201).json(user);
    } catch (error) {
        console.log("Error creating user", error);
        res.status(500).json({ message: "Error creating user" });
    }
}

//get all users
export const getAllUsers = async (req, res) => {

    try {
        const allusers = await User.find();
        res.status(200).json(allusers);
    } catch (error) {
        console.log("Error fetching users", error);
        res.status(500).json({ message: "Error fetching users" });
    }
}

//get user by id
export const getUserById = async (req, res) => {
    try {
        console.log(req);
        const userdetails = await User.findById(req.params.id);
        if (!userdetails) {
            res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User found!", user: userdetails });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user details" });
    }
}

//updat user details
export const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) {
            res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User updated successfully!", user: user });
    } catch (error) {
        res.status(500).json({ message: "Error updating user details" });
    }
}

// delete user
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully!", user: user });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user" });
    }
}

