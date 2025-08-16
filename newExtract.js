const firstYear = 2025;
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

// let htmlTable;

// const sampleUrl = releves[0].url;
// fetch(sampleUrl).then(r => r.text()).then(html => {
//   const parser = new DOMParser();
//   const subDocument = parser.parseFromString(html, 'text/html');

//   htmlTable = subDocument.querySelector("table tr:nth-child(3) table");
  
// });

// console.log(htmlTable);

const script = document.createElement("script");
script.src = "https://js.puter.com/v2/";
script.onload = () => {
    puter.ai.chat(`
      Below is a list of rows currently in raw html format you need to format into a single array (json for instance) with the following informations:
      - headers: ["DATE" (datetime), "TICKER" (text or null), "TYPE" (text, constraint: ["BUY", "SELL", "FEES", "TAXES", "DIVIDEND", "INVESTMENT", "DESINVESTMENT", "REGULARISATION", "OTHER"]), "AMOUNT" (float), "ACCOUNT" (text, constraint: ["PEA"]), "ISIN" (text or null, constraint: 12 chars), "BROKER" (text, constraint: ["BOURSE DIRECT"]),	"QUANTITY" (float or null), "URL" (text or null)]
      - raw html rows: [
        ${
          releves.map(r => {
            const parser = new DOMParser();
            const subDocument = parser.parseFromString(r.content, 'text/html');
            htmlTable = subDocument.querySelector("table tr:nth-child(3) table tbody tr:nth-child(2)");
            const rowString = htmlTable.innerHTML.replaceAll("&nbsp;", "") + "\nurl: " + r.url;
            return rowString;
          })
        }
      ]

      Notes:
      - Reports may be formatted in French, example: "ACHAT COMPTANT"= "BUY"...
      - several rows can share the same url 

      Don't hesitate to leave empty cells you don't have information for. For instance, if the row is about a money investing/desinvesting, you cannot add a ticker/isin or quantity, only an amount of money, at a date of type INVESTING.
      `, { model: "gpt-4.1-nano" })
        .then(response => console.log(response.message.content));
};
document.head.appendChild(script);
