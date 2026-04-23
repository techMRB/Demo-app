import User from '../model/user.js';
import axios from 'axios';

// Create a new user
export const createUser = async (req, res) => {
    const user = await User.create(req.body);
    res.status(201).json(user);
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

