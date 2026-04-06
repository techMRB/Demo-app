import app from "./src/index.js";
import * as dotenv from "dotenv";
import { connectDB } from "./src/config/dbConfig.js";
dotenv.config();

const PORT = process.env.PORT || 5000;
// db connection
connectDB(process.env.MONGO_URI);

app.listen(PORT, (error) => {
    if (error) {
        console.log("Error starting the server", error);
    } else {
        console.log(`Server is running on port ${PORT}`);
    }
})