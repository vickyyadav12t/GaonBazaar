const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const reviewRoutes = require("./routes/review.routes");

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Health check
app.get("/", (req, res) => {
  res.send("Farm Bazzar API running");
});

// Auth routes (password-based, no OTP)
app.use("/api/auth", authRoutes);

// User routes (protected with JWT)
app.use("/api/users", userRoutes);

// Product routes (public listing, protected CRUD)
app.use("/api/products", productRoutes);

// Order routes (all protected with JWT)
app.use("/api/orders", orderRoutes);

// Review routes (all protected with JWT)
app.use("/api/reviews", reviewRoutes);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
