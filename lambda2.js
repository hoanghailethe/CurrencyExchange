const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    try {
        const { from_currency, to_currency } = JSON.parse(event.body);

        let exchangeRate;

        if (from_currency === 'USD' || to_currency === 'USD') {
            // Case 1: One of the currencies is USD
            exchangeRate = await getExchangeRateForUSD(from_currency, to_currency);
        } else {
            // Case 2: Neither currency is USD
            exchangeRate = await calculateExchangeRateUsingUSD(from_currency, to_currency);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ exchangeRate }),
        };
    } catch (error) {
        console.error('Error converting currency:', error);
        return {
            statusCode: 500,
            body: JSON.stringify('Error converting currency'),
        };
    }
};

async function getExchangeRateForUSD(from_currency, to_currency) {
    const params = {
        TableName: 'YourDynamoDBTableName',
        KeyConditionExpression: '#date = :date AND (#base_currency = :base_currency AND #converted_currency = :converted_currency)',
        ExpressionAttributeNames: {
            '#date': 'date',
            '#base_currency': 'base_currency',
            '#converted_currency': 'converted_currency',
        },
        ExpressionAttributeValues: {
            ':date': getCurrentDate(),
            ':base_currency': from_currency === 'USD' ? 'USD' : to_currency,
            ':converted_currency': from_currency === 'USD' ? to_currency : from_currency,
        },
    };

    const result = await dynamoDB.query(params).promise();
    return result.Items[0].exchange_rate;
}

async function calculateExchangeRateUsingUSD(from_currency, to_currency) {
    const usdToBaseRate = await getExchangeRateForUSD('USD', from_currency);
    const usdToConvertedRate = await getExchangeRateForUSD('USD', to_currency);

    return usdToConvertedRate / usdToBaseRate;
}

function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}