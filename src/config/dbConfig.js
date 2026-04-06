import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const DB_OPTIONS = {
            dbName: process.env.DB_NAME,
            family: 4
        }
        await mongoose.connect(process.env.MONGO_URI, DB_OPTIONS).then(() => {
            console.log("DB Connection Successful")
        }).catch((err) => console.log("Error connecting to DB", err))
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}