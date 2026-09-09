const dotenv = require("dotenv");

dotenv.config();


const mongoDbConnection = require("./config/mongoDb")
const authRouter = require("./routes/authRouter")
const userRouter = require("./routes/userRoutes")

const express = require("express");
const cors = require("cors");

const cookieParser = require("cookie-parser");



const app = express();

const PORT = process.env.PORT || 5000;

mongoDbConnection()
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err));


// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true }));

// API Endpoints
app.get("/", (req, res) => {
    res.send("Api is Fine");
});
app.use("/api/auth", authRouter);
app.use("/api/user",userRouter)

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});