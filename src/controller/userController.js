import User from '../model/user.js';
import axios from 'axios';

// Create a new user
export const createUser = async (req, res) => {
    const user = await User.create(req.body);
    res.status(201).json(user);
}