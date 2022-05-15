import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fs = require("fs");
import { webGraph } from "./index.js";

var matchHits = {}; // { url: count}

export async function searchGraph(inputPhrase) {
  matchHits = {};
  if (webGraph.order == 0) {
    console.error("graph empty");
    return;
  }
  var inputWords = inputPhrase.toLowerCase().split(" ");
  webGraph.forEachNode((url, attributes) => {
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
