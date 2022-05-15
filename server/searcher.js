import { createRequire } from "module";
const require = createRequire(import.meta.url);
import Graph from "graphology";
const fs = require("fs");

const graph = new Graph({
  multi: true,
  allowSelfLoops: false,
  type: "directed",
});

var matchHits = {}; // { url: count}

export async function searchGraph(inputPhrase) {
  matchHits = {};
  if (graph.order == 0) {
    if (checkImport()) {
      importGraph();
    } else {
      return;
    }
  }
  var inputWords = inputPhrase.toLowerCase().split(" ");
  graph.forEachNode((url, attributes) => {
    console.log(url);
    inputWords.forEach((word) => {
      const obj = attributes.keywords;
      if (obj === undefined) {
        console.log("undefined keywords list");
      } else {
        Object.keys(obj).forEach((key) => {
          if (key.search(word) != -1) {
            // console.log(url);
            // console.log(word);
            // console.log(key);
            // console.log(obj[key]);
            updateMatches(url, obj[key]);
          }
        });
      }
    });
  });
  return matchHits;
}

async function updateMatches(url, number) {
  if (matchHits.hasOwnProperty(url)) {
    matchHits[url] = matchHits[url] + number;
  } else {
    matchHits[url] = number;
  }
}

async function checkImport() {
  const content = fs.readFileSync("graphdata.json");
  if (content.includes("options")) {
    return true;
  } else {
    return false;
  }
}

async function importGraph() {
  graph.import(JSON.parse(fs.readFileSync("graphdata.json")));
}
