import mongoose, { Schema } from "mongoose"


const userSchema = new Schema({
    user_name: {
        type: String,
        required: true,
        minLength: [3, "User name must be at least 3 characters long"]
    },
    user_email: {
        type: String,
        required: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, "Please enter a valid email address"]
    }
})

const User = mongoose.model("User", userSchema)

export default User