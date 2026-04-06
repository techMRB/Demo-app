import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import userRoutes from "./routes/userRoutes.js";


const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200,
    credentials: true
}

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use("/api/users", userRoutes);
// to test the application or API
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the application." });
});

export default app;
