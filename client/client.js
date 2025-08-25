const firstYear = 2024;
const lastYear = 2024;
const accountNumber = 1;

const urls = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i)
  .flatMap(year =>
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
      .flatMap(month =>
        Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
          .map(day =>
            `https://www.boursedirect.fr/priv/new/releveOpe.php?nc=${accountNumber}&type=RO&year=${year}&month=${month}&day=${day}&trash=/avis.pdf`
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

const parser = new DOMParser();

const formattedReleves = (await Promise.all(
  releves.map(async item => {
    const subDocument = parser.parseFromString(item.content, 'text/html');
    const htmlTable = subDocument.querySelector("table tr:nth-child(3) table").outerHTML;

    try {
      const response = await fetch("http://localhost:3000/format-releve", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ htmlTable: htmlTable, url: item.url })
      });
      return await response.json();
    } catch (error) {
      return { error: error.message, url: item.url };
    }
  })
)).flat();

const operations = await fetch("http://localhost:3000/convert-releves-to-operations", {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ formattedReleves })
}).then(response => response.json());

console.log(operations);