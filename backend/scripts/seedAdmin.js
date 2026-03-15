const mongoose = require("mongoose");
const { User } = require("../src/models/User.model");
const { hashPassword } = require("../src/utils/password.util");
require("dotenv").config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "ammufoods2018@gmail.com" });
    
    if (existingAdmin) {
      console.log("⚠️  Admin account already exists!");
      console.log("Email:", existingAdmin.email);
      console.log("Role:", existingAdmin.role);
      
      // Update password if needed
      const hashedPassword = await hashPassword("Ammu@1234");
      existingAdmin.password = hashedPassword;
      existingAdmin.role = "ADMIN";
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log("✅ Admin password updated to: Ammu@1234");
    } else {
      // Create new admin account
      const hashedPassword = await hashPassword("Ammu@1234");
      
      const admin = await User.create({
        name: "Ammu Foods Admin",
        email: "ammufoods2018@gmail.com",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
      });

      console.log("✅ Admin account created successfully!");
      console.log("Email: ammufoods2018@gmail.com");
      console.log("Password: Ammu@1234");
      console.log("Role:", admin.role);
    }

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
