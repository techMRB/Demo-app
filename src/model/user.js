import mongoose, { Schema } from "mongoose"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        minLength: [3, "User name must be at least 3 characters long"]
    },
    userContact: {
        type: String,
        required: true,
        match: [/^\d{10}$/, "Please enter a valid phone number"],
       // match: [/^(\+\d{1,3}[- ]?)?\d{10}$/, "Please enter a valid phone number"],
        unique: true,
        minLength: [10, "Phone number must be at least 10 digits long"]
    },
    userEmail: {
        type: String,
        required: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, "Please enter a valid email address"]
    },
    userPassword: {
        type: String,
        required: true,
        minLength: [6, "Password must be at least 6 characters long"],
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    userRole: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    refreshToken: {
        type: String,
        default: null
    },
    tokenVersion: {
        type: Number,
        default: 0
    },
    lastActivity: {
        type: Date,
        default: null,
        select: false
    }
})

userSchema.pre("save", async function () {
    if (!this.isModified("userPassword")) return;
    this.userPassword = await bcrypt.hash(this.userPassword, 10);
});

userSchema.methods.comparePassword = function (entered) {
    return bcrypt.compare(entered, this.userPassword);
};

userSchema.methods.invalidateSessions = function() {
    this.tokenVersion += 1;
    return this.save();
};

userSchema.methods.toSafeJSON = function() {
    return {
        id: this._id,
        name: this.userName,
        email: this.userEmail,
        role: this.userRole,
        isVerified: this.isVerified
    };
}

const User = mongoose.model("User", userSchema)

export default User