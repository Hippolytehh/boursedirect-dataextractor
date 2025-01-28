const accountNumber = 2;
const startYear = 2024;

const corresp = {
    "ACH CPT": "BUY",
    "ACHAT ETRANGER": "BUY",
    "VTE CPT": "SELL",
    "COUPONS": "COUPON",
};

function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
};

async function getInstruments(instrument) {
    const result = await fetch(`https://www.boursedirect.fr/api/search/${instrument}`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\", \"Google Chrome\";v=\"132\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest"
        },
        "referrer": "https://www.boursedirect.fr/fr/actualites",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        // "mode": "no-cors",
        "credentials": "include"
    }).then(r => r);
    const json = await result.json();
    return json;
};

async function getReport() {
    for (account = 2; account <= accountNumber; account++) {
        for (year = new Date().getFullYear() - 1; year >= startYear; year--) {
            for (month = 11; month >= 0; month--) {
                for (i = 0; i <= 5; i++) {
                    const date = new Date(year, month + 1, -i);
                    console.log(date)
                    const url = `https://www.boursedirect.fr/priv/new/releveCompte.php?nc=${account}&dt=${formatDateToYYYYMMDD(date)}&type=RE`;
                    const resp = await fetch(url).then(r => r);
                    const html = await resp.text();
                    if (html == "Erreur fatale veuillez contacter le support.") {
                        console.log(`Not OK: ${date}`)
                        continue;
                    } else {
                        console.log(`OK: ${date}`);

                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');

                        const xpath = '/html/body/table/tbody/tr[4]/td/table/tbody/tr[2]/td[2]/table/tbody';
                        const tbody = doc.evaluate(
                            xpath,
                            doc,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                        ).singleNodeValue;

                        const trs = tbody.getElementsByTagName('tr');

                        const result = Array.from(trs).slice(
                            3,
                            (trs.length + 1) - 7
                        );

                        const formatted = result.map((x, i) => {
                            return {
                                title: x.querySelectorAll("td")[0].innerText.trim(),
                                quantity: parseFloat(x.querySelectorAll("td")[1].innerText.replace(" Qté :  ", "").trim().replace(",", ".")),
                                price: parseFloat(x.querySelectorAll("td")[2].innerText.replace(" Cours :  ", "").trim().replace(",", ".")),
                                date: doc.evaluate(
                                    `/html/body/table/tbody/tr[4]/td/table/tbody/tr[2]/td[1]/table/tbody/tr[${i + 4}]`,
                                    doc,
                                    null,
                                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                                    null
                                ).singleNodeValue.querySelector("td").innerText,
                                debit: parseFloat(doc.evaluate(
                                    `/html/body/table/tbody/tr[4]/td/table/tbody/tr[2]/td[3]/table/tbody/tr[${i + 4}]`,
                                    doc,
                                    null,
                                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                                    null
                                ).singleNodeValue.querySelector("td").innerText.trim().replace(",", ".")) || 0,
                                credit: parseFloat(doc.evaluate(
                                    `/html/body/table/tbody/tr[4]/td/table/tbody/tr[2]/td[4]/table/tbody/tr[${i + 4}]`,
                                    doc,
                                    null,
                                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                                    null
                                ).singleNodeValue.querySelector("td").innerText.trim().replace(",", ".")) || 0,
                            };
                        });

                        console.log(formatted);

                        console.log(formatted.map(async (x) => {
                            let companyName = x.title;
                            Object.keys(corresp).forEach(item => {
                                companyName = (companyName.replace(item, "")).trim();
                            })
                            const data = await getInstruments(companyName);
                            if (data.instruments.data.length) {
                                // console.log(data.instruments.data)
                                // console.log(data.instruments.data[0])
                                // console.log(data.instruments.data[0].isin)
                                return {
                                    ...x,
                                    isin: data.instruments.data[0].isin,
                                    ticker: data.instruments.data[0].ticker,
                                    officialId: data.instruments.data[0].officialId,
                                    type: data.instruments.data[0].iso.type,
                                    name: data.instruments.data[0].Name
                                }
                            }
                        }));


                        // const blob = new Blob([html], { type: 'text/html' });
                        // const link = document.createElement('a');
                        // link.href = URL.createObjectURL(blob);
                        // link.download = `boursedirect-account-${account}-${formatDateToYYYYMMDD(date)}.html`;
                        // document.body.appendChild(link);
                        // link.click();
                        // document.body.removeChild(link);
                        break;
                    }
                };
                break; // DEBUG
            };
        };
    };
};

getReport();