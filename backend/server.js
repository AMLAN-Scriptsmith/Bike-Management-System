require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const db = require("./models");
const { bootstrapDatabase } = require("./services/databaseBootstrap");

const PORT = Number(process.env.PORT || 5000);
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "PUT"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log("MySQL connected successfully");

    const seeded = await bootstrapDatabase(db, { force: false, seedIfEmpty: true });
    if (seeded) {
      console.log("Database initialized and demo data seeded");
    } else {
      console.log("Database schema ready");
    }

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
})();
