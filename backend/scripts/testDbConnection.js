require("dotenv").config();
const sequelize = require("../config/database");

(async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL connection successful");
    console.log(`Host: ${process.env.DB_HOST || "localhost"}`);
    console.log(`Port: ${process.env.DB_PORT || 3306}`);
    console.log(`Database: ${process.env.DB_NAME || "bike_service_center"}`);
    process.exit(0);
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
    process.exit(1);
  }
})();
