export async function crawl(params: {
    url: string;
    maxDepth?: number;
    limit?: number;
    project_name: string;
}) {
    // Check all required environment variables
    if (!process.env.FIRECRAWL_API_URL) {
        throw new Error('FIRECRAWL_API_URL environment variable is not defined');
    }
    if (!process.env.WEBHOOK_URL) {
        throw new Error('WEBHOOK_URL environment variable is not defined');
    }

    // Log the constructed URL and request payload for debugging
    const url = `${process.env.FIRECRAWL_API_URL}/v1/crawl`;
    const payload = {
        url: params.url,
        maxDepth: params.maxDepth ?? 2,
        limit: params.limit ?? 50,
        webhook: {
            url: process.env.WEBHOOK_URL,
            metadata: {
                course_name: params.project_name
            }
        },
        // scrapeOptions: {
        //     timeout: 10000,
        //     waitFor: 500
        // }
    };
    
    console.log('Making Firecrawl API request:', {
        url,
        payload,
        webhookUrl: process.env.WEBHOOK_URL
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // Better error handling
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Firecrawl API error:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return { ...data, crawlId: data.id };
    } catch (error) {
        console.error('Fetch error details:', {
            error,
            firecrawlUrl: url,
            webhookUrl: process.env.WEBHOOK_URL
        });
        throw error;
    }
}   


export async function getCrawlStatus(crawlId: string) {
    const url = `${process.env.FIRECRAWL_API_URL}/v1/crawl/${crawlId}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return response.json();
}
