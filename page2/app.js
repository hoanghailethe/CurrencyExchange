// Replace this with your API Gateway endpoint
const apiEndpoint = 'YOUR_API_GATEWAY_ENDPOINT';

// Function to populate currency pair options in the select element
function populateCurrencyPairOptions() {
    const currencyPairs = ['USD_EUR', 'USD_GBP', 'USD_JPY', 'USD_AUD']; // Add more currency pairs as needed

    const currencyPairSelect = document.getElementById('currencyPair');

    currencyPairs.forEach(pair => {
        const option = document.createElement('option');
        option.value = pair;
        option.textContent = pair.replace('_', ' to ');
        currencyPairSelect.appendChild(option);
    });
}

// Function to fetch data from the server and render the chart
async function fetchAndRenderChart() {
    const currencyPair = document.getElementById('currencyPair').value;
    const timeFrame = document.getElementById('timeFrame').value;

    try {
        const response = await fetch(`${apiEndpoint}/time-series`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ currency_pair: currencyPair, time_frame: timeFrame }),
        });

        const result = await response.json();

        if (result && result.exchangeRates && result.exchangeRates.length > 0) {
            renderChart(result.exchangeRates, currencyPair);
        } else {
            alert('No data available for the selected parameters. Please try again.');
        }
    } catch (error) {
        console.error('Error fetching time series data:', error);
        alert('An error occurred. Please try again later.');
    }
}

// Function to render the line chart using Chart.js
function renderChart(exchangeRates, currencyPair) {
    const labels = exchangeRates.map(rate => rate.date);
    const data = exchangeRates.map(rate => rate.exchange_rate);

    const ctx = document.getElementById('exchangeChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Exchange Rate (${currencyPair.replace('_', ' to ')})`,
                borderColor: '#4caf50',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                data: data,
                fill: true,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Date',
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Exchange Rate',
                    },
                },
            },
        },
    });
}

// Initialize currency pair options
populateCurrencyPairOptions();
