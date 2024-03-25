const express = require("express");
const app = express();
const http = require("http").createServer(app);
const path = require("path");
const fs = require("fs");
const socketIO = require("socket.io");

app.use(express.static("audio"));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Replace '*' with the specific origin you want to allow
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.get("/music-list", (req, res) => {
  const musicDirectory = path.join(__dirname, "audio");
  fs.readdir(musicDirectory, (err, files) => {
    if (err) {
      console.error("Error reading music directory", err);
      res.status(500).send("Internal server error");
    } else {
      res.json(files);
    }
  });
});

app.get("/stream-audio/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "audio", filename);

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "audio/mpeg",
    };

    res.writeHead(206, head);
    fileStream.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "audio/mpeg",
    };

    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

const port = process.env.PORT || 3000;

const io = socketIO(http, {
  cors: {
    origin: "*", // Replace '*' with the specific origin you want to allow
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("stream-music", (filename) => {
    const filePath = path.join(__dirname, "audio", filename);

    const fileStream = fs.createReadStream(filePath);

    fileStream.on("data", (chunk) => {
      socket.emit("audioChunk", chunk);
    });

    fileStream.on("end", () => {
      socket.emit("audioEnd");
    });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

http.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
