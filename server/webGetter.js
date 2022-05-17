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

/**
 * It takes an array of links, and adds them to the queue if they are new
 * @param linkArray - an array of links to be added to the queue
 * @returns a promise.
 */
async function addIfNew(linkArray) {
  linkArray.forEach((element) => {
    if (element == null) {
      return;
    }
    element = element.toLowerCase();
    //FIXME capitalization is relevant
    /* Checking to see if the element starts with a / or http. If it starts with a /, it adds the
    domain to the element. If it doesn't start with http, it adds the domain and rootPath to the
    element. */
    if (element.startsWith("/")) {
      element = domain.concat(element);
    } else if (!element.startsWith("http")) {
      element = domain + rootPath + element;
    }
    /* Checking to see if the element has a # in it. If it does, it removes everything after the #. */
    if (element.indexOf("#") != -1) {
      element = element.slice(0, element.indexOf("#"));
    }
    /* Checking to see if the element starts with the domain and rootPath. If it does, it checks to see
    if the element is in the queue or has been seen before. If it hasn't, it adds it to the queue. */
    if (element.startsWith(domain + rootPath)) {
      if (!(seenUrls.has(element) || queue.includes(element))) {
        addElement(element);
      }
    }
  });
  return;
}

/**
 * It adds an element to the queue, merges the element into the graph, and adds a directed edge from
 * the current URL to the element as long as they are different
 * @param element - The URL to add to the queue.
 */
async function addElement(element) {
  queue.push(element);
  webGraph.mergeNode(element);
  if (currentURL != element) {
    webGraph.addDirectedEdge(currentURL, element);
  }
}

/**
 * It takes a URL as input, and then it uses the got library to get the html of the page, and
 * the cheerio library to parse the html. Then it calls the generateLinks and generateKeywords
 * functions. Then it loops through until the queue is empty
 * @param inputURL - The URL that the user wants to crawl.
 * @returns a promise.
 */
export async function initializeGraph(inputURL) {
  /* Clearing the queue and the set of seen urls. */
  queue = [];
  seenUrls = new Set();

  /* Taking the input URL and parsing it into its domain and root path. Then it adds the root URL to the
   queue. */
  var rootURL = inputURL;
  var parsedURL = parseURL(rootURL);
  domain = parsedURL.protocol + "//" + parsedURL.host;
  rootPath = parsedURL.pathname;
  queue.push(rootURL);

  /* A while loop that is checking to see if the queue is empty. If it is not empty, it
  takes the first element in the queue and assigns it to currentURL. Then it merges the currentURL
  into the graph. Then it uses the got library to get the html of the page. Then it uses the cheerio
  library to parse the html. Then it calls the generateLinks and generateKeywords functions. */
  while (queue.length > 0) {
    currentURL = queue.shift();
    console.log(`starting analysis of ${currentURL}`);
    webGraph.mergeNode(currentURL);
    //FIXME make helper method for getting data
    /* Getting the html of the page, and then parsing it with cheerio. Then it calls the generateLinks
    and generateKeywords functions. */
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
  //console.log(webGraph.inspect());
  await writeToFile();
  return;
}

/**
 * It takes the text from the html and puts it into an array as separate words. Then it iterates
 * through the array of words on the page and adds them to a dictionary
 * finally it adds the dictionary to the node
 * @param $ - the cheerio object that contains the html of the page
 * @param currentURL - The URL of the page that is being crawled.
 */
function generateKeywords($, currentURL) {
  var keywordsList = {};
  const textObjects = $("html");
  const pageText = [];
  /* Taking the text from the html and putting it into an array as separate words. */
  textObjects.each((index, element) => {
    const paragraphText = $(element).text().toLowerCase().split(" ");
    paragraphText.forEach((element) => {
      pageText.push(element.replace(/[^a-zA-Z0-9]/g, ""));
    });
  });
  /* Iterating through the array of words on the page and adding them to a dictionary. */
  pageText.forEach((element) => {
    if (keywordsList.hasOwnProperty(element)) {
      keywordsList[element]++;
    } else {
      keywordsList[element] = 1;
    }
  });
  /* adds the word Dictionary to the attributes of the graph node */
  webGraph.setNodeAttribute(currentURL, "keywords", keywordsList);
}

/**
 * It takes a cheerio object, finds all the links on the page, and adds them to the queue if they
 * haven't been seen before
 * @param $ - the cheerio object
 */
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

/**
 * It takes the data from the webGraph object and writes it to a file called graphdata.json
 * @returns the result of the Promise.all() function.
 */
async function writeToFile() {
  console.log("writing to file");
  return fs.writeFile(
    "graphdata.json",
    JSON.stringify(webGraph.export()),
    function (err) {
      if (err) return console.log(err);
      console.log("Successfully wrote to file");
    }
  );
}

/**
 * It takes an error object as an argument, logs it to the console, and then appends it to a file
 * called errors.txt
 * @param err - the error object
 * @returns the error message.
 */
function writeError(err) {
  //console.log(err);
  fs.appendFile(
    "errors.txt",
    currentURL + ":  " + err.toString() + `\n`,
    function (err) {
      if (err) return console.log(err);
      console.log("Succesfully wrote error to file");
    }
  );
}
