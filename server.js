import express from 'express';
import { Client } from "@notionhq/client";
import { formatReleve, renderReleves, generatePrompt, chunkArray } from './functions.js';
import cors from "cors";
import { Mistral } from '@mistralai/mistralai';
import fs from "fs";

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const mistralApiKey = process.env.MISTRAL_API_KEY;

const mistralClient = new Mistral({ apiKey: mistralApiKey })

const app = express();
app.use(express.json());
app.use(cors({
  origin: "https://www.boursedirect.fr"
}));
const port = 3000;


// ********************************************************

app.post('/format-releve', async (req, res) => {
    const htmlTable = req.body.htmlTable;
    const url = req.body.url;
    if (!htmlTable) {
        return res.status(400).send('HTML table is required');
    }
    try {
        const formattedReleve = formatReleve({ htmlTable, url });
        return res.json(formattedReleve);
    } catch (error) {
        console.error('Error formatting releve:', error);
        return res.status(500).send('Error formatting releve');
    };
});

const requestCounts = new Map();
const RATE_LIMIT = 5;  
const TIME_WINDOW = 60e3;  // 1 minute (in ms)
const CHUNK_SIZE = 25;

app.post('/convert-releves-to-operations', async (req, res) => {

    const ip = req.ip;
    const now = Date.now();
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
    }
    const timestamps = requestCounts.get(ip);
    while (timestamps.length && now - timestamps[0] > TIME_WINDOW) {
        timestamps.shift();
    }
    if (timestamps.length >= RATE_LIMIT) {
        return res.status(429).json({ error: "Too many requests, please slow down." });
    }
    timestamps.push(now);
    
    const formattedReleves = req.body.formattedReleves;
    if (!formattedReleves || !Array.isArray(formattedReleves)) {
        return res.status(400).send('Invalid releves data');
    };
    
    const renderedReleves = renderReleves(formattedReleves);
    if (!renderedReleves || !Array.isArray(renderedReleves)) {
        return res.status(400).send('Invalid releves data');
    };

    const chunkReleves = chunkArray(renderedReleves, CHUNK_SIZE);

    const prompts = chunkReleves.map(chunk => {
        const prompt = generatePrompt(chunk);
        return prompt;
    });

    // console.log(prompts);

    try {
        const operations = await Promise.all(
            prompts.map(async (prompt, i) => {
                console.info(`Requesting Mistral AI with prompt ${i}`);
                const chatResponse = await mistralClient.chat.complete({
                    model: "mistral-small-latest",
                    messages: [{ role: "user", content: prompt }],
                });
                const raw = chatResponse.choices[0].message.content;
                return raw;
            })
        );
        
        const result = operations.map(x => JSON.parse(x.replaceAll("```json", "").replaceAll("```", ""))).flat();
        console.info(`Returning an array of ${result.length} items`);

        return res.json(result);

    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: err.message });
    };

});

// ********************************************************

app.post('/add-data', async (req, res) => {
    const accountType = req.query.accountType;
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
            DATE: { date: { start: new Date(item.DATE).toISOString() } },
            ...(item.SECURITY && { TICKER: { select: { name: item.SECURITY.replaceAll(",", ".") } } }),
            ...(item.TYPE && { TYPE: { select: { name: item.TYPE } } }),
            ...(item.AMOUNT != null && { AMOUNT: { number: item.AMOUNT } }),
            ACCOUNT: { select: { name: accountType ?? "CTO" } },
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

    return res.json({
        message: 'Data added successfully',
        databaseId: databaseId
    });

});

app.get('/create-notion-db', async (req, res) => {
    const response = await notion.databases.create({
        parent: { page_id: "2414ca7f41e480eea921c7294fa9d2b5" },
        title: [{ type: 'text', text: { content: `Portfolio` } }],
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
    return res.json(response.id);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})