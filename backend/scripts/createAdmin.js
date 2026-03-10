require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || "Eventlys Admin";

    if (!email || !password) {
      throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
    }

    const existing = await User.findOne({ email });

    if (existing) {
      existing.role = "admin";
      await existing.save();
      console.log("✅ Existing user promoted to admin:", email);
    } else {
      const hash = await bcrypt.hash(password, 10);

      await User.create({
        name,
        email,
        passwordHash: hash,
        role: "admin",
      });

      console.log("✅ Admin user created:", email);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
}

createAdmin();