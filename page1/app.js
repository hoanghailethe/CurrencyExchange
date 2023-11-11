// Replace this with your API Gateway endpoint
const apiEndpoint = 'YOUR_API_GATEWAY_ENDPOINT';

// Function to populate currency options in the select elements
function populateCurrencyOptions() {
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD']; // Add more currencies as needed

    const fromCurrencySelect = document.getElementById('fromCurrency');
    const toCurrencySelect = document.getElementById('toCurrency');

    currencies.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency;
        option.textContent = currency;
        fromCurrencySelect.appendChild(option.cloneNode(true));
        toCurrencySelect.appendChild(option);
    });
}

// Function to handle currency conversion
async function convertCurrency() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const amount = document.getElementById('amount').value;

    try {
        const response = await fetch(`${apiEndpoint}/convert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from_currency: fromCurrency, to_currency: toCurrency, amount: amount }),
        });

        const result = await response.json();

        if (result && result.exchangeRate) {
            const convertedAmount = (amount * result.exchangeRate).toFixed(2);
            document.getElementById('result').textContent = `${convertedAmount} ${toCurrency}`;
        } else {
            document.getElementById('result').textContent = 'Conversion failed. Please try again.';
        }
    } catch (error) {
        console.error('Error converting currency:', error);
        document.getElementById('result').textContent = 'An error occurred. Please try again later.';
    }
}

// Initialize the currency options
populateCurrencyOptions();
