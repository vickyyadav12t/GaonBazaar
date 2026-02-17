const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";
const JWT_EXPIRES_IN = "7d";

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const sanitizeUser = (user) => {
  const plain = user.toObject ? user.toObject() : user;
  delete plain.password;
  return plain;
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      role,
      state,
      district,
      village,
      ...rest
    } = req.body;

    if (!name || !phone || !password) {
      return res
        .status(400)
        .json({ message: "Name, phone and password are required" });
    }

    const orConditions = [{ phone }];
    if (email) {
      orConditions.push({ email });
    }

    const existingUser = await User.findOne({ $or: orConditions });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this phone or email" });
    }

    const user = new User({
      name,
      phone,
      email,
      password,
      role: role || "farmer",
      location: {
        state,
        district,
        village,
      },
      ...rest, // any additional registration fields
    });

    await user.save();

    const token = generateToken(user);

    return res.status(201).json({
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    console.error("Register error:", err);

    // Handle common Mongoose validation / duplicate errors more clearly
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "User already exists with this phone or email" });
    }

    // Fallback
    return res
      .status(500)
      .json({ message: err.message || "Server error during registration" });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    if ((!phone && !email) || !password) {
      return res
        .status(400)
        .json({ message: "Phone or email and password are required" });
    }

    const query = phone ? { phone } : { email };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    return res.json({
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

