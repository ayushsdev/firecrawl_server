import express, { Request, Response } from 'express';
import { crawl, getCrawlStatus } from './src/api/firecrawl';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// const corsOptions = {
//     origin: 'https://uiuc.chat',
// };

// app.use(cors()); // Enable CORS for all routes and origins
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        res.status(200).json({});
    } else {
        next();
    }
});


app.post('/crawl', async (req: Request, res: Response) => {
    console.log(req.body);
    try {
        const response = await crawl(req.body);
        console.log(`Crawl completed successfully. Number of results: ${response.crawlId}`);
        console.log(response);
        res.status(200).json({ crawlId: response.crawlId });   
    } catch (error) {
        const e = error as Error;
        res.status(500).json({ error: 'An error occurred during the upload', errorTitle: e.name, errorMessage: e.message });
    } finally {
        if (global.gc) {
            global.gc();
        }
    }
});

app.get('/crawl/:crawlId', async (req: Request, res: Response) => {
    try {
        const status = await getCrawlStatus(req.params.crawlId);
        console.log(`Retrieved status for crawl ${req.params.crawlId}`);
        res.status(200).json(status);
    } catch (error) {
        const e = error as Error;
        res.status(500).json({ error: 'An error occurred while getting crawl status', errorTitle: e.name, errorMessage: e.message });
    } finally {
        if (global.gc) {
            global.gc();
        }
    }
});

app.post('/webhook/crawl', async (req: Request, res: Response) => {
    try {
        const { success, type, id, data, error, metadata } = req.body;
        
        if (type === 'crawl.page') {
            // Process each page in the data array
            for (const page of data) {
                console.log('Webhook data structure:', {
                    markdown: page.markdown,
                    dataMetadata: page.metadata,   
                });

                if (!process.env.INGEST_URL) {
                    throw new Error('INGEST_URL environment variable is not defined');
                }
                
                await fetch(process.env.INGEST_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.BEAM_API_KEY}`
                    },
                    body: JSON.stringify({
                        url: page.metadata.sourceURL,
                        base_url: page.metadata.ogUrl,
                        content: page.markdown,
                        readable_filename: page.metadata.title || page.metadata.ogURL,
                        course_name: metadata.course_name,
                        groups: ['firecrawl']
                    })
                });
            }
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        const e = error as Error;
        console.error('Webhook error:', e);
        res.status(500).json({ error: 'Webhook processing failed', message: e.message });
    }
});

app.get('/test', (req: Request, res: Response) => {
    res.status(200).json({ 
        message: 'Server is running!',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});