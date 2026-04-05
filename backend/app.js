const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

const apiRoutes = require("./routes");
const loggingMiddleware = require("./middlewares/loggingMiddleware");
const { notFoundHandler, errorHandler } = require("./middlewares/errorMiddleware");
const swaggerSpec = require("./config/swagger");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Backend is running" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", apiRoutes);

const frontendBuildPath = path.resolve(__dirname, "../build");
app.use(express.static(frontendBuildPath));

app.get("*", (req, res, next) => {
  const bypassPaths = ["/api", "/api-docs", "/health", "/uploads"];
  if (bypassPaths.some((prefix) => req.path.startsWith(prefix))) {
    return next();
  }
  return res.sendFile(path.join(frontendBuildPath, "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
