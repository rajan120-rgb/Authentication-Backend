const { login , logout , register, sendVeryfyOtp, verifyEmail, isAuthenticated, sendResetOtp, resetPassword } = require("../controllers/authController")

const express = require("express");
const userAuth = require("../middleware/userAuth");

const authRouter = express.Router();

authRouter.post("/register",register);
authRouter.post("/login",login);
authRouter.post("/logout",logout);
authRouter.post("/send-verify-otp", userAuth , sendVeryfyOtp);
authRouter.post("/verify-account", userAuth , verifyEmail);
authRouter.get("/is-auth", userAuth , isAuthenticated);
authRouter.post("/send-reset-otp" , sendResetOtp);
authRouter.post("/reset-password" , resetPassword);


module.exports = authRouter ;