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

const webGraph = new Graph({
  multi: true,
  allowSelfLoops: false,
  type: "directed",
});

async function importGraph() {
  webGraph.import(JSON.parse(fs.readFileSync("graphdata.json")));
}

async function checkImport() {
  const content = fs.readFileSync("graphdata.json");
  if (content.includes("options")) {
    return true;
  } else {
    return false;
  }
}
export { webGraph };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3001;

const app = express();

app.use(express.static(path.resolve(__dirname, "../client/build")));

app.get("/api", (req, res) => {
  console.log(`sent message`);
  res.json({ message: "hello from server!" });
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
  importGraph();
  //initializeGraph("https://www.rodsbooks.com/refind/"); //;.then(function () {
  //   console.log(searchGraph("uninstall"));
  // });
  console.log(searchGraph("install"));
});

//FIXME mmove graph variable into index
app.get("/api/loadwebsite", (req, res) => {
  //FIXME parse req into a valid url
  execute(req);
  console.log("test");
});
