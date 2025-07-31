const urls = Array.from({ length: 2025 - 2022 + 1 }, (_, i) => 2022 + i)
  .flatMap(year =>
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
      .flatMap(month =>
        Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
          .map(day =>
            `https://www.boursedirect.fr/priv/new/releveOpe.php?nc=1&type=RO&year=${year}&month=${month}&day=${day}&trash=/avis.pdf`
          )
      )
  );

const testUrls = async (urlsToTest) => {
  const results = await Promise.all(
    urlsToTest.map(async (url) => {
      try {
        const response = await fetch(url, { method: 'GET' }); // Use HEAD to just get headers
        const html = await response.text();
        return { url, status: response.status, html: html};
      } catch (error) {
        return { url, error: error.message };
      }
    })
  );
  console.log(results);
};