const fs = require("fs");

const _ = require("lodash");

const PDFExtract = require("pdf.js-extract").PDFExtract;
const pdfExtract = new PDFExtract();

const options = {};

const extractData = async (filename) => {
  let retJson = {};
  let res = await pdfExtract
    .extract(filename, options)
    .then((data) => {
      //#region data handler
      const removeSpaces = (str) => {
        let retStr = '';
        for (let i = 0; i < str.length; i++) if (str[i] !== ' ') retStr += str[i];
        return retStr;
      }
      const getDataBeginWith = (str, pattern) => {
        let pos = str.search(pattern);
        if (pos === -1) return "";
        let retStr = "";
        for (let i = pos; i < str.length; i++) retStr += str[i];
        return retStr;
      };
      const getDataAfterColon = (str) => {
        let pos = -1;
        for (let i = 0; i < str.length; i++) {
          if (str[i] === ":") {
            pos = i;
            break;
          }
        }
        if (pos === -1) return "";
        let retStr = "";
        for (let i = pos + 1; i < str.length; i++) retStr += str[i];
        return retStr;
      };
      const removeVietnameseTones = (str) => {
        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
        str = str.replace(/đ/g, "d");
        str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
        str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
        str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
        str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
        str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
        str = str.replace(/Đ/g, "D");
        // Some system encode vietnamese combining accent as individual utf-8 characters
        // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
        str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
        str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
        // Remove extra spaces
        // Bỏ các khoảng trắng liền nhau
        str = str.replace(/ + /g, " ");
        str = str.trim();
        // Remove punctuations
        // Bỏ dấu câu, kí tự đặc biệt
        // str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g," ");
        return str;
      };
      const standardStr = (str) => {
        str = removeVietnameseTones(str);
        let retStr = "";
        for (let i = 0; i < str.length; i++) {
          if (str[i] === " ") continue;
          asciiCode = str[i].charCodeAt(0);
          if (asciiCode >= 65 && asciiCode <= 90)
            retStr += String.fromCharCode(asciiCode + 32);
          // if (asciiCode >= 97 && asciiCode <= 122) retStr += str[i];
          else retStr += str[i];
        }
        return retStr;
      };

      let randomData = data.pages[0].content;
      for (let i = 0; i < randomData.length; i++)
        randomData[i].y = Math.floor(randomData[i].y);

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
      let posH = 0;
      for (let i = 0; i < dataMatrix.length; i++) {
        let str = "";
        for (let j = 0; j < dataMatrix[i].length; j++)
          str += dataMatrix[i][j].str;
        if (str.search("Mẫu số") != -1) {
          posH = i;
          break;
        }
      }
      for (let i = posH; i < dataMatrix.length; i++) {
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
      //#endregion
      //#region Header
      // console.log("\nHeader: ");

      let taxId1Found = 0,
        address1Found = 0,
        companyFound = 0;

      for (let i = 0; i < header.length; i++) {
        let str = "";
        for (let j = 0; j < header[i].length; j++) {
          str += header[i][j].str;
        }
        standardedStr = standardStr(str);

        if (standardedStr.match("mauso")) {
          retJson.templateCode = getDataAfterColon(str).trim();
        }
        if (standardedStr.match("kyhieu")) {
          retJson.invoiceSeries = getDataAfterColon(str).trim();
        }
        if (standardedStr.match("so:") || standardedStr.match(/so\(/)) {
          retJson.invoiceNumber = getDataAfterColon(str).trim();
        }
        if (standardedStr.match("hinhthucthanhtoan")) {
          // console.log(`Hinh thuc thanh toan: ${getDataAfterColon(str)}`);

        }
        if (standardedStr.match("diachi:") || standardedStr.match(/diachi\(/)) {
          if (address1Found) {
            retJson.buyerAddressLine = getDataAfterColon(str).trim();
          } else {
            retJson.sellerAddressLine = getDataAfterColon(str).trim();
            address1Found = true;
          }
        }
        if (
          standardedStr.match("masothue:") ||
          standardedStr.match(/masothue\(/)
        ) {
          if (taxId1Found) {
            retJson.buyerTaxCode = removeSpaces(getDataAfterColon(str));
          } else {
            retJson.sellerTaxCode = removeSpaces(getDataAfterColon(str));
            taxId1Found = true;
          }
        }
        if (standardedStr.match("ngay")) {
          retJson.invoiceIssuedDate = getDataBeginWith(str, "Ngày").trim();
        }
        if (standardedStr.match("nguoimua")) {
          retJson.buyerDisplayName = getDataAfterColon(str).trim();
        }
        if (
          standardedStr.match("congty") ||
          standardedStr.match("congti") ||
          standardedStr.match("dntn")
        ) {
          // remember to check if stk includes chinhanh || standardedStr.match("chinhanh")) {
          let dt;
          if (str.search(":") !== -1) dt = getDataAfterColon(str);
          else {
            dt = getDataBeginWith(str, "CÔNG TY");
            if (!dt) dt = getDataBeginWith(str, "Công Ty");
            if (!dt) dt = getDataBeginWith(str, "Công ty");
          }
          if (companyFound) {
            retJson.buyerLegalName = dt.trim();

          } else {
            retJson.sellerLegalName = dt.trim();
            companyFound = true;
          }
        }
      }
      //#endregion
      return retJson;
      //#region Footer
      sttFound = false;
      let posIF, posJF;

      for (let i = posI; i < dataMatrix.length; i++) {
        if (sttFound) break;
        for (let j = 0; j < dataMatrix[i].length; j++) {
          posIF = i;
          posJF = j;
          if (
            dataMatrix[i][j].str.search("Cộng tiền hàng") !== -1 ||
            dataMatrix[i][j].str.search("Tiền hàng hóa") !== -1
          ) {
            sttFound = true;
            break;
          }
          if (j === 0) body.push(new Array());
          body[body.length - 1].push(dataMatrix[i][j]);
        }
      }
      // console.log("\nBody: ");

      for (let i = 0; i < body.length; i++) {
        let str = "";
        for (let j = 0; j < body[i].length; j++) {
          str += body[i][j].str;
        }
        // console.log(str);
      }

      sttFound = false;

      for (let i = posIF; i < dataMatrix.length; i++) {
        if (sttFound) break;
        for (let j = 0; j < dataMatrix[i].length; j++) {
          if (j === 0) footer.push(new Array());
          footer[footer.length - 1].push(dataMatrix[i][j]);
        }
      }

      // console.log("\nFooter: ");

      /*
    for (let i = 0; i < footer.length; i++) {
      let str = "";
      for (let j = 0; j < footer[i].length; j++) {
        str += footer[i][j].str;
      }
      console.log(str);
    }
    */
      // fs.writeFileSync("data.json", JSON.stringify(dataMatrix));
      //#endregion
    })
    .catch((err) => {
      console.log(err);
    });
  return res;
};

const callExtractData = async() => {

let dt = await extractData("./pdfs/1.pdf");

console.log(dt);
}

callExtractData();