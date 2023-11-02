const express = require("express");
const app = express();
const parser = require("xml2json");

const PORT = 3000;

// Just to check if connect alive in browser
app.get("/", (req, res) => {
 res.send(`Server started on port : ${PORT}`);
});

// Basic Parsing Method
app.post("/parse", (req, res) => {
 let data = "";
 req.on("data", (chunk) => (data += chunk));
 req.on("error", (err) => {
  res.status(400).send(err.message);
 });
 req.on("end", () => {
  data = data
   .replace(/>[\s]+</g, "><")
   .replace(/\n/g, "")
   .replace(/\t/g, "")
   .replace(/[\s]{2,}/g, " ");

  // To check if data if empty
  if (data.trim() === "") {
   res.status(400).send("Empty data sent!");
  } else {
   const parsedData = parser.toJson(data);

   res
    .status(200)
    .setHeader("Content-Type", "application/json")
    .send(parsedData);
  }
 });
});

app.listen(PORT, () => {
 console.log(`Server started on port : ${PORT}`);
});
