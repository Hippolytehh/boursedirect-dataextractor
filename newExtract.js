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

const parser = new DOMParser();

const formattedReleves = (await Promise.all(
  releves.map(async item => {
    const subDocument = parser.parseFromString(item.content, 'text/html');
    const htmlTable = subDocument.querySelector("table tr:nth-child(3) table");
    const tableHtml = htmlTable ? htmlTable.outerHTML : null;

    try {
      const response = await fetch("http://localhost:3000/format-releve", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ htmlTable: tableHtml, url: item.url })
      });
      return await response.json();
    } catch (error) {
      return { error: error.message, url: item.url };
    }
  })
)).flat();

const renderedReleves = await fetch("http://localhost:3000/render-releves", {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ formattedReleves })
}).then(response => response.json());

const promptText = await fetch("http://localhost:3000/generate-prompt", {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ renderedReleves })
}).then(response => response.json());

const script = document.createElement("script");
script.src = "https://js.puter.com/v2/";
script.onload = () => {
    puter.ai.chat(promptText.prompt, { model: "gpt-4.1-mini" })
        .then(response => {
          console.log(response.message.content);
          localStorage.setItem('operations', response.message.content);
        });
};
document.head.appendChild(script);
