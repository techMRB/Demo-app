import mongoose, { Schema } from "mongoose"


const userSchema = new Schema({
    user_name: {
        type: String,
        required: true,
        minLength: [3, "User name must be at least 3 characters long"]
    },
    user_contact: {
        type: String,
        required: true,
        match: [/^(\+\d{1,3}[- ]?)?\d{10}$/, "Please enter a valid phone number"],
        unique: true,
        minLength: [10, "Phone number must be at least 10 digits long"]
    },
    user_email: {
        type: String,
        required: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, "Please enter a valid email address"]
    },
    user_password: {
        type: String,
        required: true,
        minLength: [6, "Password must be at least 6 characters long"]
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
        default: null
    }
})

const User = mongoose.model("User", userSchema)

export default User