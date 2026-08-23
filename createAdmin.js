import mongoose from "mongoose";
import User from "./src/model/user.js";
import dotenv from "dotenv";

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const existingAdmin = await User.findOne({
            userEmail: process.env.ADMIN_EMAIL
        });

        if (existingAdmin) {
            console.log("Admin already exists");
            return;
        }
        console.log("admin contct", process.env.ADMIN_CONTACT);
        const admin = await User.create({
            userName: process.env.ADMIN_NAME,
            userContact: process.env.ADMIN_CONTACT,
            userEmail: process.env.ADMIN_EMAIL,
            userPassword: process.env.ADMIN_PASSWORD,
            userRole: "admin",
            isVerified: true
        });
        console.log("Admin created successfully:", admin);
        console.log("Admin created successfully:", admin.userEmail);

    } catch (error) {
        console.error("Error creating admin:", error);
    } finally {
        await mongoose.disconnect();
    }
};

createAdmin();