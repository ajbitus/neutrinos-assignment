const express = require("express");
const app = express();
const parser = require("xml2json");
const NodeCache = require("node-cache");
const cluster = require("cluster");
const totalCPUs = require("os").cpus().length;

const PORT = 3001;

// For XML caching
const serverCache = new NodeCache();

// Main cluster to manage other clusters
if (cluster.isMaster) {
 console.log(`Number of CPUs is ${totalCPUs}`);
 console.log(`Master ${process.pid} is running`);

 // Fork workers.
 for (let i = 0; i < totalCPUs; i++) {
  cluster.fork();
 }

 cluster.on("exit", (worker, code, signal) => {
  console.log(`worker ${worker.process.pid} died`);
  console.log("Let's fork another worker!");
  cluster.fork();
 });
} else {
 // Non-main clusters here
 const app = express();
 console.log(`Worker ${process.pid} started`);

 // Just to check if connect alive in browser
 app.get("/", (req, res) => {
  res.send(`Server started on port : ${PORT}`);
 });

 app.post("/parse/optimized", (req, res) => {
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
    const cachedData = serverCache.get(data);

    if (cachedData) {
     res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .send(cachedData);
    } else {
     const parsedData = parser.toJson(data);

     serverCache.set(data, parsedData, 10000);

     res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .send(parsedData);
    }
   }
  });
 });

 app.listen(PORT, () => {
  console.log(`Server started on port : ${PORT}`);
 });
}
