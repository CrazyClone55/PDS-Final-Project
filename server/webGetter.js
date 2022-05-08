import { createRequire } from "module";
const require = createRequire(import.meta.url);

const HashMap = require("hashmap");
const pretty = require("pretty");
import Graph from "graphology";
const fs = require("fs");
import * as cheerio from "cheerio";
import got, { ParseError, parseLinkHeader } from "got";
const parseURL = require("url-parse");

//TODO Tracker array {url: status}
var seenUrls = new Set();
var queue = [];
const graph = new Graph({
  multi: true,
  allowSelfLoops: false,
  type: "directed",
});
var currentURL;
var rootPath;
var domain;
//const uselessWords = ["the", "it", "an", "a", "for", "of"];
//FIXME domain appends another slash, see errors.txt

async function addIfNew(linkArray) {
  linkArray.forEach((element) => {
    if (element == null) {
      return;
    }
    element = element.toLowerCase();
    //FIXME capitalization is relevant
    if (element.startsWith("/")) {
      element = domain.concat(element);
    } else if (!element.startsWith("http")) {
      element = domain + rootPath + element;
    }
    if (element.startsWith(domain + rootPath)) {
      if (!(seenUrls.has(element) || queue.includes(element))) {
        //FIXME only add link to queue if it starts with rootURL
        addElement(element);
      }
    }
    //FIXME for adding directed edge it should be different
  });
  return;
}

async function addElement(element) {
  queue.push(element);
  graph.mergeNode(element);
  if (currentURL != element) {
    graph.addDirectedEdge(currentURL, element);
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
  console.log("importing Graph");
  graph.import(JSON.parse(fs.readFileSync("graphdata.json")));
  console.log(graph.inspect());
}

export default async function initializeGraph(inputURL) {
  if (await checkImport()) {
    await importGraph();
    return;
  }
  //TODO read in starting url and exclude patters from JSON
  //FIXME validation for rootURL
  //FIXME add getting keywords from page
  var rootURL = inputURL;
  var parsedURL = parseURL(rootURL);
  domain = parsedURL.protocol + "//" + parsedURL.host;
  rootPath = parsedURL.pathname;
  console.log(rootPath);
  queue.push(rootURL);

  while (queue.length > 0) {
    currentURL = queue.shift();
    console.log(`starting analysis of ${currentURL}`);
    graph.mergeNode(currentURL);
    //FIXME make helper method for getting data
    await got(currentURL)
      .then((response) => {
        const $ = cheerio.load(response.rawBody, null, true);
        generateLinks($);
        generateKeywords($, currentURL);
      })
      .catch((err) => {
        writeError(err);
      });
  }
  console.log(graph.inspect());
  writeToFile();
}

function generateKeywords($, currentURL) {
  var keywordsList = {};
  const textObjects = $("html");
  const pageText = [];
  //FIXME see if I can do all text
  textObjects.each((index, element) => {
    const paragraphText = $(element).text().split(" ");
    paragraphText.forEach((element) => {
      pageText.push(element.replace(/[^a-zA-Z0-9]/g, ""));
    });
  });
  //console.log(pageText);
  pageText.forEach((element) => {
    if (keywordsList.hasOwnProperty(element)) {
      keywordsList[element]++;
    } else {
      keywordsList[element] = 1;
    }
  });
  //console.log(keywordsList);
  //paragraphText.forEach(element);
  graph.setNodeAttribute(currentURL, "keywords", keywordsList);
}

function generateLinks($) {
  //FIXME add for listitems
  const linkObjects = $("a");
  const links = [];
  linkObjects.each((index, element) => {
    links.push($(element).attr("href"));
  });
  addIfNew(links);
  seenUrls.add(currentURL);
  console.log(queue.length);
}

function writeToFile() {
  fs.writeFile(
    "graphdata.json",
    JSON.stringify(graph.export()),
    function (err) {
      if (err) return console.log(err);
      console.log("Successfully wrote to file");
    }
  );
}

function writeError(err) {
  console.log(err);
  fs.appendFile(
    "errors.txt",
    currentURL + ":  " + err.toString() + `\n`,
    function (err) {
      if (err) return console.log(err);
      console.log("Succesfully wrote error to file");
    }
  );
}
