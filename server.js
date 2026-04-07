const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  }
});

let waitingUser = null;

io.on("connection", (socket) => {

  console.log("User connected");

  // MATCH USERS
  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("matched");
    waitingUser.emit("matched");

    waitingUser = null;
  } else {
    waitingUser = socket;
  }

  // CHAT
  socket.on("chat", (msg) => {
    if (socket.partner) {
      socket.partner.emit("chat", msg);
    }
  });

  // NEXT USER
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

      waitingUser = null;
    } else {
      waitingUser = socket;
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    if (socket.partner) {
      socket.partner.emit("partner_disconnected");
    }
  });

});

app.get("/", (req, res) => {
  res.send("BolNepal Backend Running 🚀");
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});