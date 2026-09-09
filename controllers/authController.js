const UserModel = require("../models/userModel")

const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken");
const transporter = require("../config/nodemailer");



async function register(req, res) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.json({ success: false, message: "Missing Details" });
    }

    try {
        const existing = await UserModel.findOne({ email: email });
        if (existing) return res.json({ success: false, message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await UserModel.create({
            name,
            email,
            password: hashedPassword,
        });

        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "1d" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        // Sending welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to Rajan',
            text: `Welcome to Rajan website. Your account has been created with email id: ${email}`
        }

        await transporter.sendMail(mailOptions)

        return res.json({ success: true })
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}


async function login(req, res) {

    const { email, password } = req.body;

    if (!email || !password) return res.json({ success: false, message: "Email and password required" });

    try {
        const user = await UserModel.findOne({ email: email });

        if (!user) return res.json({ success: false, message: "Invalid email" });

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) return res.json({ success: false, message: "Invalid password" });

        const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "1d" });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.json({ success: true })

    } catch (error) {
        res.json({ success: false, message: error.message });

    }
};

async function logout(req, res) {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.json({ success: true, message: "Logged Out" })
    } catch (error) {
        res.json({ success: false, message: error.message });

    }
};

// Send Varification otp to User's email
async function sendVeryfyOtp(req, res) {
    try {
        const userID = req.userID;

        const user = await UserModel.findById(userID);

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account is already verified" })
        };

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP is ${otp}. Verify your accout using this otp`
        }

        await transporter.sendMail(mailOption);

        res.json({ success: true, message: "Verification OTP sent on Email" })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
};

async function verifyEmail(req, res) {
    const userID = req.userID;
    const { otp } = req.body;

    if (!userID || !otp) {
        return res.json({ success: false, message: "Missing Details" })
    }
    try {
        const user = await UserModel.findById(userID);

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        };

        if (user.verifyOtp === "" || user.verifyOtp !== otp) {
            res.json({ success: false, message: "Invalid OTP" });
        };

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP expired" });
        };

        user.isAccountVerified = true;

        user.verifyOtp = "";
        user.verifyOtpExpireAt = 0;
        await user.save();

        return res.json({ success: true, message: "Email verified successfully" })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}

// Check if user is authenticated
async function isAuthenticated(req, res) {
    try {
        return res.json({ success: true });
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


// Send password reset function
async function sendResetOtp(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.json({ success: false, message: "Email is required" })
    };

    try {
        const user = await UserModel.findOne({email});
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        };

        // if (user.isAccountVerified) {
        //     return res.json({ success: false, message: "Account already verified" })
        // };

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.resetOtp = otp;

        user.resetOptExpireAt = Date.now() + 15 * 60 * 1000;

        await user.save()

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Reset OTP',
            text: `Your OTP is ${otp}. Reset your account using this otp`
        }

        await transporter.sendMail(mailOption);
        return res.json({ success: true, message: "Reset otp send successfully" })

    } catch (error) {
        return res.json({ success: false, message: error.message })
    };
}

// Reset user password
async function resetPassword(req,res) {
    const {email,otp,newPassword} = req.body;
    if(!email || !otp || !newPassword) {
        return res.json({success:false , message:"Email,otp nad new password are required"})
    };

    try {
        const user = await UserModel.findOne({email});

        if(!user) {
            return res.json({success:false , message:"User not found"});
        };

        if(user.resetOtp === "" || user.resetOtp !== otp){
            return res.json({success:false , message:"Invalid otp"})
        };

        if(user.resetOptExpireAt < Date.now()){
            return res.json({success:false , message:"OTP expired"})
        };

        const hashedPassword = await bcrypt.hash(newPassword , 10);

        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOptExpireAt = 0 ;

        await user.save();

        return res.json({success:true , message:"Password has been reset successfully"})
    } catch (error) {
        return res.json({ success:false , message:error.message})
    }
}

module.exports = {
    register,
    login,
    logout,
    sendVeryfyOtp,
    verifyEmail,
    isAuthenticated,
    sendResetOtp,
    resetPassword,
}