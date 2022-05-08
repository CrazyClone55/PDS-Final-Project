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

async function getlinks() {
  return;
}

export default async function initializeGraph(inputURL) {
  const content = fs.readFileSync("graphdata.json");
  if (content.includes("options")) {
    console.log("importing from file");
    graph.import(JSON.parse(content));
    console.log(graph.inspect());
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
        console.log("got response");
        // DEV console.log(response);
        const $ = cheerio.load(response.rawBody, null, true);
        const linkObjects = $("a");
        const links = [];
        linkObjects.each((index, element) => {
          links.push($(element).attr("href"));
        });
        addIfNew(links);
        seenUrls.add(currentURL);
        console.log(queue.length);
      })
      .catch((err) => {
        console.log(err);
        fs.appendFile(
          "errors.txt",
          currentURL + ":  " + err.toString() + `\n`,
          function (err) {
            if (err) return console.log(err);
            console.log("Succesfully wrote error to file");
          }
        );
      });
  }
  console.log(graph.inspect());
  fs.writeFile(
    "graphdata.json",
    JSON.stringify(graph.export()),
    function (err) {
      if (err) return console.log(err);
      console.log("Succesfully wrote graph to file");
    }
  );
}
