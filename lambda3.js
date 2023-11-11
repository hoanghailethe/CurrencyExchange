const AWS = require('aws-sdk');
const axios = require('axios');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dax = new AWS.DAX({ endpoints: ['YOUR_DAX_ENDPOINT'] });

exports.handler = async (event, context) => {
    try {
        const { currency_pair, time_frame } = JSON.parse(event.body);

        const exchangeRates = await getHistoricalExchangeRates(currency_pair, time_frame);

        return {
            statusCode: 200,
            body: JSON.stringify({ exchangeRates }),
        };
    } catch (error) {
        console.error('Error fetching historical exchange rates:', error);
        return {
            statusCode: 500,
            body: JSON.stringify('Error fetching historical exchange rates'),
        };
    }
};

async function getHistoricalExchangeRates(currency_pair, time_frame) {
    const cacheKey = `${currency_pair}_${time_frame}`;
    const cachedData = await getFromCache(cacheKey);

    if (cachedData) {
        return cachedData;
    }

    const [from_currency, to_currency] = currency_pair.split('_');

    let exchangeRates;

    if (from_currency === 'USD' || to_currency === 'USD') {
        exchangeRates = await getExchangeRatesForUSD(from_currency, to_currency, time_frame);
    } else {
        exchangeRates = await calculateExchangeRateUsingUSD(from_currency, to_currency, time_frame);
    }

    await addToCache(cacheKey, exchangeRates);

    return exchangeRates; 
}

async function calculateExchangeRateUsingUSD(from_currency, to_currency, time_frame) {
    const usdToBaseRates = await getExchangeRatesForUSD('USD', from_currency, time_frame);
    const usdToConvertedRates = await getExchangeRatesForUSD('USD', to_currency, time_frame);

    const exchangeRates = [];

    for (let i = 0; i < usdToBaseRates.length; i++) {
        const date = usdToBaseRates[i].date;
        const exchange_rate = usdToConvertedRates[i].exchange_rate / usdToBaseRates[i].exchange_rate;

        exchangeRates.push({ date, exchange_rate });
    }

    return exchangeRates;
}


async function getExchangeRatesForUSD(from_currency, to_currency, time_frame) {
    const params = {
        TableName: 'YourDynamoDBTableName',
        KeyConditionExpression: '#currency_pair = :currency_pair',
        ExpressionAttributeNames: {
            '#currency_pair': 'currency_pair',
        },
        ExpressionAttributeValues: {
            ':currency_pair': `${from_currency}_${to_currency}`,
        },
        Limit: calculateQueryLimit(time_frame),
        ScanIndexForward: false,
    };

    const result = await queryDynamoDB(params);

    return parseDataForFrontend(result.Items);
}


async function queryDynamoDB(params) {
    try {
        const data = await dax.query(params).promise();
        return data;
    } catch (error) {
        console.error('Error querying DynamoDB:', error);
        throw error;
    }
}

function parseDataForFrontend(data) {
    // Implement parsing logic suitable for frontend chart rendering
    // You may want to transform the data into the format expected by your frontend library (e.g., Chart.js)
    return data.map(item => ({
        date: item.date,
        exchange_rate: item.exchange_rate, 
        timestamp: item.date,
        // Add more properties as needed
    }));
}

// Cache control
async function getFromCache(key) {
    try {
        const data = await dax.getItem({
            TableName: 'YourDAXCacheTableName',
            Key: { key },
        }).promise();

        if (data.Item) {
            const cachedData = JSON.parse(data.Item.value);
            const expirationTime = new Date(cachedData.timestamp).getTime() + 24 * 60 * 60 * 1000; // 24 hours

            if (Date.now() < expirationTime) {
                return cachedData.data;
            } else {
                // Cache has expired, remove it
                await removeFromCache(key);
            }
        }

        return null;
    } catch (error) {
        console.error('Error fetching from cache:', error);
        return null;
    }
}

async function removeFromCache(key) {
    try {
        await dax.deleteItem({
            TableName: 'YourDAXCacheTableName',
            Key: { key },
        }).promise();
    } catch (error) {
        console.error('Error removing from cache:', error);
    }
}



async function addToCache(key, value) {
    try {
        await dax.putItem({
            TableName: 'YourDAXCacheTableName',
            Item: {
                key,
                value: JSON.stringify(value),
            },
        }).promise();
    } catch (error) {
        console.error('Error adding to cache:', error);
    }
}

function calculateQueryLimit(time_frame) {
    // Implement logic to calculate the query limit based on the specified time frame
    // Adjust the limit as needed to optimize performance
    return 100; // Default limit
}
