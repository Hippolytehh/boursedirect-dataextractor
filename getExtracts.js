function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
};

async function getReport() {
    for (year = new Date().getFullYear() - 1; year >= 2022; year--) {
        for (month = 11; month >= 0; month--) {
            for (i = 0; i <= 5; i++) {
                const date = new Date(year, month + 1, -i);
                console.log(date)
                const url = `https://www.boursedirect.fr/priv/new/releveCompte.php?nc=1&dt=${formatDateToYYYYMMDD(date)}&type=RE`;
                const resp = await fetch(url).then(r => r);
                const html = await resp.text();
                if (html == "Erreur fatale veuillez contacter le support.") {
                    console.log(`Not OK: ${date}`)
                    continue;
                } else {
                    console.log(`OK: ${date}`)
                    const blob = new Blob([html], { type: 'text/html' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `page-${formatDateToYYYYMMDD(date)}.html`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    break;
                }
            };
        };
    };
};

getReport();