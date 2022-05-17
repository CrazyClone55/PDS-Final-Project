import { createRequire } from "module";
const require = createRequire(import.meta.url);
const fs = require("fs");
import { webGraph } from "./index.js";

/* stores the pages that contain the search term */
/* as well as the number of matches */
var matchHits = {}; // { url: count}

/**
 * It iterates through each node in the graph and checks if the input words are in the keywords list.
 * If they are, it will update the number of matches for that URL
 * @param inputPhrase - The input phrase that the user has entered.
 * @returns the matchHits object.
 */
export async function searchGraph(inputPhrase) {
  /* Checking if the graph is empty. If it is, it will return an error. */
  matchHits = {};
  if (webGraph.order == 0) {
    console.error("graph empty");
    return;
  }

  /* Taking the input phrase and splitting it into an array of words. */
  var inputWords = inputPhrase.toLowerCase().split(" ");

  /* Iterating through each node in the graph and checking if the input words are in the keywords list.
  If they are, it will update the number of matches for that URL. */
  webGraph.forEachNode((url, attributes) => {
    console.log(url);
    inputWords.forEach((word) => {
      const obj = attributes.keywords;
      /* Checking if the keywords list is undefined. If it is, it will print an error message. If it is
      not, it will iterate through the keywords list and check if the input word is in the list. If
      it is, it will update the number of matches for that URL. */
      if (obj === undefined) {
        console.log("undefined keywords list");
      } else {
        Object.keys(obj).forEach((key) => {
          if (key.search(word) != -1) {
            updateMatches(url, obj[key]);
          }
        });
      }
    });
  });
  return matchHits;
}

/**
 * It takes a URL and a number, and adds the number to the number of hits for that URL
 * @param url - The URL of the page that was visited.
 * @param number - The number of matches to add to the current number of matches.
 */
async function updateMatches(url, number) {
  if (matchHits.hasOwnProperty(url)) {
    matchHits[url] = matchHits[url] + number;
  } else {
    matchHits[url] = number;
  }
}
