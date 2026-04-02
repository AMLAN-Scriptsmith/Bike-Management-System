require("dotenv").config();
const db = require("../models");
const { bootstrapDatabase } = require("../services/databaseBootstrap");

(async () => {
  try {
    const seeded = await bootstrapDatabase(db, { force: false, seedIfEmpty: true });
    if (seeded) {
      console.log("Database setup completed with baseline seed data");
    } else {
      console.log("Database schema ready (existing data kept)");
    }

    process.exit(0);
  } catch (error) {
    console.error("Database setup failed:", error.message);
    process.exit(1);
  }
})();
