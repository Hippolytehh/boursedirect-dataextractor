import { JSDOM } from 'jsdom';
import { Operation } from './models/operation.js';

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
      return `
      
      YOU MUST RETURN A JSON ONLY (NOTHING ELSE). Your json must be stringify as less as possible.

      HERE'S SOMETHING I WANT YOU TO AVOID, the JSON starting with "json\n[\n  {". Please prefer "\n[\n{" and add "\" only if needed".

      At the end of the prompt, you will have a list of operations you need to clean and reformat. 

      I need you to make these raw operations match a standard schema of operations as following (mongoose): 
      ${
        JSON.stringify(Operation.schema.obj)
      }
      
      ***WARNING***
      THE LENGHT OF THE ARRAY YOUR WILL RETURN MUST BE EQUAL TO THE LENGTH OF THE ARRAY I PROVIDE YOU, PLEASE DO NOT REMOVE/ADD OBJECTS.
      
      Don't hesitate to leave empty cells you don't have information for. For instance, if the row is about a money investing/desinvesting, you cannot add a SECURITY/isin or quantity, only an amount of money, at a date of type INVESTING.
      
      DATA:
      - Number of operations to process: ${renderedReleves.length} ;
      - Below are the operations you need to process: 
      
        ${JSON.stringify(
          renderedReleves
        )}
      `
};

export const chunkArray = (arr, step) => {
    const result = [];
    for (let i = 0; i < arr.length; i += step) {
        result.push(arr.slice(i, i + step));
    };
    return result;
};
