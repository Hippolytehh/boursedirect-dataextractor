import express from 'express';
// import { Client } from "@notionhq/client";
import { formatReleve, renderReleves, generatePrompt, chunkArray } from './functions.js';
import cors from "cors";
import { Mistral } from '@mistralai/mistralai';
// const notion = new Client({ auth: process.env.NOTION_API_KEY });

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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})