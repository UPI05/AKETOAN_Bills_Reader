/*
const pdf = require('pdf-parse');

 
const fs = require('fs');

let dataBuffer = fs.readFileSync('./pdfs/9.pdf');
 
pdf(dataBuffer).then(function(data) {
    console.log(data.text.split('\n'));
});
*/

const fs = require("fs");

const _ = require("lodash");

const PDFExtract = require("pdf.js-extract").PDFExtract;
const pdfExtract = new PDFExtract();

const options = {};

pdfExtract.extract("./pdfs/8.pdf", options, (err, data) => {
  if (err) return console.log(err);

  let randomData = data.pages[0].content;

  /*
  // Multi pages
  for (let i = 0; i < data.pages.length; i++) {
    // Add page property. for (let j = 0; j < random.length; j++) randomData[j].
    for (let j = 0; j < data.pages[i].length; j++) randomData.push(data.pages[i][j]);
  }
  */

  if (!randomData) return console.log("No data");

  // Extract data into matrix

  let dataMatrix = new Array();

  const sortedData = _.sortBy(randomData, ["y", "x"]);

  dataMatrix.push(new Array());

  dataMatrix[0].push(sortedData[0]);

  for (let i = 1; i < sortedData.length; i++) {
    if (
      sortedData[i].y ==
      dataMatrix[dataMatrix.length - 1][
        dataMatrix[dataMatrix.length - 1].length - 1
      ].y
    ) {
      dataMatrix[dataMatrix.length - 1].push(sortedData[i]);
    } else {
      dataMatrix.push(new Array());
      dataMatrix[dataMatrix.length - 1].push(sortedData[i]);
    }
  }

  fs.writeFileSync('data.json', JSON.stringify(sortedData));

  // Print dataMatrix
/*
  let cnt = 0;
  let found = 0;
  for (let i = 0; i < dataMatrix.length; i++) {
    // for (let j = 0; j < dataMatrix[i].length; j++) console.log(dataMatrix[i][j]);
    for (let j = 0; j < dataMatrix[i].length; j++)
      if (dataMatrix[i][j].str.search("STT") !== -1) found = 1;
    if (dataMatrix[i].length > 0 && found) {
      let str = "";
      //for (let j = 0; j < dataMatrix[i].length; j++) str += dataMatrix[i][j].str;
      //console.log(str);
      for (let j = 0; j < dataMatrix[i].length; j++)
        console.log(dataMatrix[i][j]);
      cnt++;

      console.log("===============================================");
    }
  }
  console.log(cnt);*/


  // Extract data into header, body and footer

  let header = new Array();
  let body = new Array();
  let footer = new Array();

  let sttFound = false;

  let posI, posJ;

  for (let i = 0; i < dataMatrix.length; i++) {
    if (sttFound) break;
    for (let j = 0; j < dataMatrix[i].length; j++) {
      posI = i;
      posJ = j;
      if (dataMatrix[i][j].str.search("STT") !== -1) {
        sttFound = true;
        break;
      }
      if (j === 0) header.push(new Array());
      header[header.length - 1].push(dataMatrix[i][j]);
    }
  }

  console.log("\nHeader: ");

  for (let i = 0; i < header.length; i++) {
    let str = "";
    for (let j = 0; j < header[i].length; j++) {
      str += header[i][j].str;
    }
    console.log(str);
  }

  sttFound = false;
  let posIF, posJF;

  for (let i = posI; i < dataMatrix.length; i++) {
    if (sttFound) break;
    for (let j = 0; j < dataMatrix[i].length; j++) {
      posIF = i;
      posJF = j;
      if (dataMatrix[i][j].str.search("Cộng tiền hàng") !== -1 || dataMatrix[i][j].str.search("Tiền hàng hóa") !== -1) {
        sttFound = true;
        break;
      }
      if (j === 0) body.push(new Array());
      body[body.length - 1].push(dataMatrix[i][j]);
    }
  }
  console.log("\nBody: ");

  for (let i = 0; i < body.length; i++) {
    let str = "";
    for (let j = 0; j < body[i].length; j++) {
      str += body[i][j].str;
    }
    console.log(str);
  }

  sttFound = false;

  for (let i = posIF; i < dataMatrix.length; i++) {
    if (sttFound) break;
    for (let j = 0; j < dataMatrix[i].length; j++) {
      if (j === 0) footer.push(new Array());
      footer[footer.length - 1].push(dataMatrix[i][j]);
    }
  }

  console.log("\nFooter: ");

  for (let i = 0; i < footer.length; i++) {
    let str = "";
    for (let j = 0; j < footer[i].length; j++) {
      str += footer[i][j].str;
    }
    console.log(str);
  }
});
