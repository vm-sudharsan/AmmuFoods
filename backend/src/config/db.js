const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // These options help with connection stability
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log("✅ MongoDB connected successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error("Error:", error.message);
    
    // Provide helpful error messages
    if (error.message.includes("ENOTFOUND")) {
      console.error("\n💡 Possible issues:");
      console.error("   - Check your internet connection");
      console.error("   - Verify MongoDB Atlas cluster is running");
      console.error("   - Check MONGO_URI in .env file");
    } else if (error.message.includes("authentication failed")) {
      console.error("\n💡 Possible issues:");
      console.error("   - Check username and password in MONGO_URI");
      console.error("   - Verify database user exists in MongoDB Atlas");
    } else if (error.message.includes("IP")) {
      console.error("\n💡 Possible issues:");
      console.error("   - Add your IP to MongoDB Atlas whitelist");
      console.error("   - Or add 0.0.0.0/0 to allow all IPs");
    }
    
    console.error("\n🔧 Your MONGO_URI:", process.env.MONGO_URI?.replace(/:[^:@]+@/, ":****@"));
    process.exit(1);
  }
};

module.exports = connectDB;
