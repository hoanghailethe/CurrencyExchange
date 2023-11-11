const AWS = require('aws-sdk');
const axios = require('axios');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    const maxRetries = 3;
    let currentRetry = 0;

    while (currentRetry < maxRetries) {
        try {
            const externalApiResponse = await axios.get('YOUR_EXTERNAL_API_ENDPOINT');
            const exchangeRates = externalApiResponse.data.rates;

            await saveToDynamoDB(exchangeRates);

            return {
                statusCode: 200,
                body: JSON.stringify('Data updated successfully'),
            };
        } catch (error) {
            console.error('Error updating data:', error);

            // Increment retry counter
            currentRetry++;

            // Add a delay before the next retry (you can adjust the duration)
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    // If max retries reached, return an error response
    return {
        statusCode: 500,
        body: JSON.stringify('Max retries reached. Error updating data.'),
    };
};