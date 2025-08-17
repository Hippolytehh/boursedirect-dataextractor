import express from 'express';
import { Client } from "@notionhq/client";
import { randomUUID } from 'crypto';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const app = express();
app.use(express.json());
const port = 3000;


app.post('/add-data', async (req, res) => {
    const databaseId = req.query.databaseId;
    if (!databaseId) {
        return res.status(400).send('Database ID is required');
    };

    const db = await notion.databases.query({
        database_id: databaseId,
    });

    const body = req.body;

    for (const item of body) {
        console.log(item.DATE);

        if (!item.DATE) continue; // skip invalid dates

        const properties = {
            Name: { title: [{ text: { content: randomUUID() } }] },
            DATE: { date: { start: new Date(item.DATE).toISOString() } },
            ...(item.SECURITY && { TICKER: { select: { name: item.SECURITY.replaceAll(",", ".") } } }),
            ...(item.TYPE && { TYPE: { select: { name: item.TYPE } } }),
            ...(item.AMOUNT != null && { AMOUNT: { number: item.AMOUNT } }),
            ACCOUNT: { select: { name: "PEA" } },
            ...(item.ISIN && { ISIN: { select: { name: item.ISIN } } }),
            BROKER: { select: { name: "BOURSE DIRECT" } },
            ...(item.QUANTITY != null && { QUANTITY: { number: item.QUANTITY } }),
            ...(item.URL && { URL: { url: item.URL } })
        };

        // Remove undefined properties
        Object.keys(properties).forEach(key => properties[key] === undefined && delete properties[key]);

        await notion.pages.create({
            parent: { database_id: databaseId },
            properties
        });

        // Wait 50ms between requests to prevent conflict errors
        await new Promise(resolve => setTimeout(resolve, 0.2));
    };
});

app.get('/create-notion-db', async (req, res) => {
    const response = await notion.databases.create({
        parent: { page_id: "2414ca7f41e480eea921c7294fa9d2b5" },
        title: [{ type: 'text', text: { content: 'Your Portfolio' } }],
        properties: {
            Name: { title: {} },
            Description: { rich_text: {} },
            DATE: { date: {} },
            TICKER: { select: {} },
            TYPE: { select: {} },
            AMOUNT: { number: {} },
            ACCOUNT: { select: {} },
            ISIN: { select: {} },
            BROKER: { select: {} },
            QUANTITY: { number: {} },
            URL: { url: {} }
        }
    });
    return res.json(response);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})