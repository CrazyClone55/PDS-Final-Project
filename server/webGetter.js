//FIXME analyse similar pages
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { webGraph } from "./index.js";
const fs = require("fs");
import * as cheerio from "cheerio";
import got, { ParseError, parseLinkHeader } from "got";
const parseURL = require("url-parse");

//TODO Tracker array {url: status}
var seenUrls = new Set();
var queue = [];

var currentURL;
var rootPath;
var domain;

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
    if (element.indexOf("#") != -1) {
      element = element.slice(0, element.indexOf("#"));
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
  webGraph.mergeNode(element);
  if (currentURL != element) {
    webGraph.addDirectedEdge(currentURL, element);
  }
}

export async function initializeGraph(inputURL) {
  var rootURL = inputURL;
  var parsedURL = parseURL(rootURL);
  domain = parsedURL.protocol + "//" + parsedURL.host;
  rootPath = parsedURL.pathname;
  queue.push(rootURL);

  while (queue.length > 0) {
    currentURL = queue.shift();
    console.log(`starting analysis of ${currentURL}`);
    webGraph.mergeNode(currentURL);
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
  console.log(webGraph.inspect());
  await writeToFile();
  return;
}

function generateKeywords($, currentURL) {
  var keywordsList = {};
  const textObjects = $("html");
  const pageText = [];
  textObjects.each((index, element) => {
    const paragraphText = $(element).text().toLowerCase().split(" ");
    paragraphText.forEach((element) => {
      pageText.push(element.replace(/[^a-zA-Z0-9]/g, ""));
    });
  });
  pageText.forEach((element) => {
    if (keywordsList.hasOwnProperty(element)) {
      keywordsList[element]++;
    } else {
      keywordsList[element] = 1;
    }
  });
  webGraph.setNodeAttribute(currentURL, "keywords", keywordsList);
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

async function writeToFile() {
  console.log("writing to file");
  fs.writeFile(
    "graphdata.json",
    JSON.stringify(webGraph.export()),
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
