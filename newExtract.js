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
        return { url, status: response.status, hasReleve: html.startsWith("Erreur fatale veuillez contacter le support Capitol") ? false : true };
      } catch (error) {
        return { url, error: error.message };
      }
    })
  );
  const hasReleveResults = results.filter(result => result.hasReleve);
  return hasReleveResults;
};

// Write to browser memory
await testUrls(urls).then(r).then(r => {
    localStorage.setItem('releves', JSON.stringify(r));
})