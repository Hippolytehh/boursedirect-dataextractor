import { JSDOM } from 'jsdom';

const transpose = (arrays) => {
  if (!arrays.length) return [];
  return arrays[0].map((_, i) => arrays.map(row => row[i]));
};

const formatMergeArr = (data) => {
  const result = [];
  let current = null;

  data.forEach(row => {
    if (row[0].trim() !== "") {
      // Start a new main row
      current = [...row]; // clone
      result.push(current);
    } else if (current) {
      // Append non-empty values to the end of the last row
      row.forEach(cell => {
        if (cell.trim() !== "") {
          current.push(cell);
        }
      });
    }
  });

  return result;
};

export const formatReleve = ({ htmlTable, url }) => {

  const DOM = new JSDOM(htmlTable);
  const document = DOM.window.document;

  const firstTr = document.querySelector("tr:nth-child(1)");
  const headerNodes = firstTr.querySelectorAll("td");
  const headers = [...headerNodes].map(header => {
    return header.textContent.trim();
  });

  const secondTr = document.querySelector("tr:nth-child(2)");
  const tdNodes = secondTr.children;
  const trs = [...tdNodes].map(td => {
    const tbody = td.querySelector("tbody");
    const trNodes = tbody.querySelectorAll(":scope > tr");
    return [...trNodes];
  });
  const transposedTrs = transpose(trs);
  let toFormatArr = transposedTrs.map(arr => {
    return arr.map(tr => {
      return tr.textContent.trim();
    });
  });
  toFormatArr = toFormatArr.filter(x => x.some((elem) => elem != ''));
  return formatMergeArr(toFormatArr).map((x) => {
        return {
          url: url,
          headers: [...headers, "Quantité", "Détails"],
          values: [...x.slice(0, 5), x.slice(5).join(" // ")]
        };
    });
};

export const renderReleves = (formattedReleves) => {
  return formattedReleves.flat().map(obj => {
    const mapped = obj.headers.reduce((acc, header, index) => {
      acc[header] = obj.values[index];
      return acc;
    }, {});
    mapped.url = obj.url;
    return mapped;
  });
};

export const generatePrompt = (renderedReleves) => {
      return `Below is a list of unformatted rows I extracted from html reports. I need you to format them properly into a single array of objects (json) with the following informations:

      ***WARNING***
      THE LENGHT OF THE ARRAY YOUR WILL RETURN MUST BE EQUAL TO THE LENGTH OF THE ARRAY I PROVIDE YOU, PLEASE DO NOT REMOVE/ADD OBJECTS.

      Notes:
      - Return a JSON that is already a JSON.stringify, so I can directly save it to the browser memory
      - reports are formatted in French, example: "ACHAT COMPTANT"= "BUY"...
      - if there is a constraint, the value must match the constraint (ex: if you see a "coupons", the closest type is "DIVIDEND"...)
      - if you see a 12 character long string starting with 2 letters as a country code, followed by 10 digits and characters, it is an ISIN code
      - SECURITY is usually a value that is not really meaningful to you because it is a security name/code, it will come after the ISIN code if both the ISIN and SECURITY exist (usually for BUY/SELL/COUPON)

      Don't hesitate to leave empty cells you don't have information for. For instance, if the row is about a money investing/desinvesting, you cannot add a SECURITY/isin or quantity, only an amount of money, at a date of type INVESTING.
      
      - columns: ["DATE" (datetime), "SECURITY" (text or null), "TYPE" (text or null, constraint: ["BUY", "SELL", "FEES", "TAXES", "DIVIDEND", "INVESTMENT", "DESINVESTMENT", "REGULARISATION", "OTHER"]), "AMOUNT" (float), "ACCOUNT" (text, constraint: ["PEA"]), "ISIN" (text or null, constraint: must be 12 chars), "BROKER" (text, constraint: ["BOURSE DIRECT"]),	"QUANTITY" (float or null), "URL" (text or null)]
      - raw data (${renderedReleves.length} rows BEWARE OF RESPECTING THE LENGTH OF THE ARRAY):
        ${JSON.stringify(
          renderedReleves
        )}.
      `
};