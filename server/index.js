import { createRequire } from "module";
const require = createRequire(import.meta.url);
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { initializeGraph } from "./webGetter.js";
import { searchGraph } from "./searcher.js";
import Graph from "graphology";
const fs = require("fs");
const cors = require("cors");

/* Creating a new graph object. */
const webGraph = new Graph({
  multi: true,
  allowSelfLoops: false,
  type: "directed",
});
export { webGraph };

/**
 * reads the contents of graphdata.json, parses it as JSON, and then imports the
 * resulting object into the webGraph Graphology object
 * used to store graph locally as well as in memory
 */
async function importGraph() {
  webGraph.import(JSON.parse(fs.readFileSync("graphdata.json")));
}

/**
 * It checks if "graphdata.json" contains the word "options".
 * this would indicate if there is a JSON graph object saved already
 */
async function checkImport() {
  const content = fs.readFileSync("graphdata.json");
  if (content.includes("options")) {
    return true;
  } else {
    return false;
  }
}

/* This is setting up the server. */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = 3001;
const app = express();
app.use(express.json());
app.use(cors());

/* This is a route that accepts a post request from the frontend. It then calls the searchGraph
function with the phrase that was sent in the request. It then sends the searchData back to the
frontend. */
app.post("/search", async (req, res) => {
  const searchData = await searchGraph(req.body.phrase);
  res.json({ data: searchData });
});

/* main api call, accepts url from frontend and loads the graph */
app.post("/load", async (req, res) => {
  //FIXME parse req into a valid url
  var url = req.body.url;
  console.log(url);
  await initializeGraph(url).catch((err) => {
    console.log(err);
    res.json({ data: err });
  });
  res.json({ data: "id something" });
});

/* This is a catch-all route that will serve the index.html file for any request that doesn't match a
previous route. */
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
});

/* This is the main function that starts the server. */
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
