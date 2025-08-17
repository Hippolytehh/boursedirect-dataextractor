const firstYear = 2022;
const lastYear = 2025;

const urls = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i)
  .flatMap(year =>
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
      .flatMap(month =>
        Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
          .map(day =>
            `https://www.boursedirect.fr/priv/new/releveOpe.php?nc=2&type=RO&year=${year}&month=${month}&day=${day}&trash=/avis.pdf`
          )
      )
  );

const testUrls = async (urlsToTest) => {
  const results = await Promise.all(
    urlsToTest.map(async (url) => {
      try {
        const response = await fetch(url, { method: 'GET' }); // Use HEAD to just get headers
        const html = await response.text();
        return { url, status: response.status, hasReleve: html.startsWith("Erreur fatale veuillez contacter le support Capitol") ? false : true, content: html };
      } catch (error) {
        return { url, error: error.message };
      }
    })
  );
  const hasReleveResults = results.filter(result => result.hasReleve);
  return hasReleveResults;
};

// Write to browser memory
await testUrls(urls).then(r => {
    localStorage.setItem('releves', JSON.stringify(r));
});




const releves = JSON.parse(localStorage.getItem('releves'));

function transpose(arrays) {
  if (!arrays.length) return [];
  return arrays[0].map((_, i) => arrays.map(row => row[i]));
};

function formatMergeArr(data) {
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

const formatReleves = () => {
  return releves.map(r => {
    const parser = new DOMParser();
    const subDocument = parser.parseFromString(r.content, 'text/html');
    const htmlTable = subDocument.querySelector("table tr:nth-child(3) table tbody");
    const firstTr = htmlTable.querySelector("tr:nth-child(1)");
    const headerNodes = firstTr.querySelectorAll("td");
    const headers = [...headerNodes].map(header => {
      return header.innerText.trim();
    });
    const secondTr = htmlTable.querySelector("tr:nth-child(2)");
    const tdNodes = secondTr.querySelectorAll(":scope > td");
    const trs = [...tdNodes].map(td => {
      const tbody = td.querySelector("tbody");
      const trNodes = tbody.querySelectorAll(":scope > tr");
      return [...trNodes];
    });
    const transposedTrs = transpose(trs);
    let toFormatArr = transposedTrs.map(arr => {
      return arr.map(tr => {
        return tr.innerText.trim();
      });
    });
    toFormatArr = toFormatArr.filter(x => x.some((elem) => elem != ''));
    return formatMergeArr(toFormatArr).map((x) => {
            return {
              url: r.url,
              headers: [...headers, "Quantité", "Détails"],
              values: [...x.slice(0, 5), x.slice(5).join(" // ")]
            };
        });
  });
};

const renderReleves = () => {
  return formatReleves().flat().map(obj => {
    const mapped = obj.headers.reduce((acc, header, index) => {
      acc[header] = obj.values[index];
      return acc;
    }, {});
    mapped.url = obj.url;
    return mapped;
  });
};

const generatePrompt = () => {
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
      - raw data (${renderReleves().length} rows BEWARE OF RESPECTING THE LENGTH OF THE ARRAY):
        ${JSON.stringify(
          renderReleves()
        )}.
      `
};

const script = document.createElement("script");
script.src = "https://js.puter.com/v2/";
script.onload = () => {
    puter.ai.chat(generatePrompt(), { model: "gpt-5-mini" })
        .then(response => {
          console.log(response.message.content);
          localStorage.setItem('operations', response.message.content);
        });
};
document.head.appendChild(script);
