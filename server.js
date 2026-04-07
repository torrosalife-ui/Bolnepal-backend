const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

// IMPORTANT for Render + mobile apps
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store waiting user
let waitingUser = null;

// When user connects
io.on("connection", (socket) => {

  console.log("🔵 New user connected:", socket.id);

  // MATCH USERS
  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("matched");
    waitingUser.emit("matched");

    console.log("✅ Users matched");

    waitingUser = null;
  } else {
    waitingUser = socket;
    console.log("⏳ Waiting for another user...");
  }

  // CHAT MESSAGE
  socket.on("chat", (msg) => {
    if (socket.partner) {
      socket.partner.emit("chat", msg);
    }
  });

  // NEXT USER (Skip)
  socket.on("next", () => {

    if (socket.partner) {
      socket.partner.emit("partner_disconnected");
      socket.partner.partner = null;
    }

    socket.partner = null;

    if (waitingUser) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit("matched");
      waitingUser.emit("matched");

      console.log("🔁 Rematched users");

      waitingUser = null;
    } else {
      waitingUser = socket;
      console.log("⏳ Waiting again...");
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);

    if (socket.partner) {
      socket.partner.emit("partner_disconnected");
      socket.partner.partner = null;
    }

    if (waitingUser === socket) {
      waitingUser = null;
    }
  });

});

// ROOT ROUTE (IMPORTANT for browser test)
app.get("/", (req, res) => {
  res.send("🚀 BolNepal Backend Running Successfully!");
});

// REQUIRED FOR RENDER
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
