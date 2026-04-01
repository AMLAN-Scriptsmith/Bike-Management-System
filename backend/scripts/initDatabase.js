require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const dbName = process.env.DB_NAME || "bike_service_center";

  let connection;

  try {
    connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database ensured: ${dbName}`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to initialize database:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
})();
