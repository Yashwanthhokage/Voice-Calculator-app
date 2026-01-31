/*******************************
 * ELEMENTS
 *******************************/
const display = document.getElementById("display");
const convertBtn = document.getElementById("convertBtn");
const micBtn = document.getElementById("micBtn");

/*******************************
 * EXCHANGE RATES (USD BASED)
 *******************************/
const exchangeRates = {
  USD: 1,
  INR: 83,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 147
};

/*******************************
 * CURRENCY ALIASES (VOICE SAFE)
 *******************************/
const currencyAliases = {
  // USD
  dollar: "USD",
  dollars: "USD",
  usd: "USD",
  "$": "USD",

  // INR
  rupee: "INR",
  rupees: "INR",
  inr: "INR",
  rs: "INR",
  "rs.": "INR",
  "₹": "INR",

  // EUR
  euro: "EUR",
  euros: "EUR",
  eur: "EUR",

  // GBP
  pound: "GBP",
  pounds: "GBP",
  gbp: "GBP",

  // JPY
  yen: "JPY",
  jpy: "JPY"
};

/*******************************
 * NORMALIZE VOICE TEXT
 *******************************/
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/\$/g, " dollar ")
    .replace(/₹|rs\.?|rupees?/g, " rupee ")
    .replace(/\s+/g, " ")
    .trim();
}

/*******************************
 * PARSE VOICE INPUT
 *******************************/
function parseVoiceCommand(text) {
  text = normalizeText(text);

  // Examples:
  // "100 rupee to dollar"
  // "convert 50 dollars to inr"
  const match = text.match(
    /(\d+(?:\.\d+)?)\s*(\w+)\s*(?:to|in)\s*(\w+)/
  );

  if (!match) return null;

  let amount = parseFloat(match[1]);
  let from = match[2];
  let to = match[3];

  from = currencyAliases[from] ||
         currencyAliases[from.replace(/s$/, "")] ||
         from.toUpperCase();

  to = currencyAliases[to] ||
       currencyAliases[to.replace(/s$/, "")] ||
       to.toUpperCase();

  if (!exchangeRates[from] || !exchangeRates[to]) {
    return null;
  }

  return { amount, from, to };
}

/*******************************
 * CONVERT CURRENCY
 *******************************/
function convertCurrency(amount, from, to) {
  const amountInUSD = amount / exchangeRates[from];
  return amountInUSD * exchangeRates[to];
}

/*******************************
 * MANUAL CONVERSION BUTTON
 *******************************/
convertBtn.addEventListener("click", () => {
  const amount = parseFloat(display.value);
  const from = document.getElementById("fromCurrency").value;
  const to = document.getElementById("toCurrency").value;

  if (isNaN(amount)) {
    alert("Enter a valid amount");
    return;
  }

  const result = convertCurrency(amount, from, to);
  display.value = result.toFixed(2);
});

/*******************************
 * VOICE RECOGNITION
 *******************************/
let recognition;

if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const voiceText = event.results[0][0].transcript;

    alert("VOICE HEARD: " + voiceText);

    const parsed = parseVoiceCommand(voiceText);

    if (!parsed) {
      alert("Could not understand currency command");
      return;
    }

    const result = convertCurrency(
      parsed.amount,
      parsed.from,
      parsed.to
    );

    display.value = result.toFixed(2);
  };

  recognition.onerror = (e) => {
    alert("Voice error: " + e.error);
  };
}

/*******************************
 * MIC BUTTON
 *******************************/
micBtn.addEventListener("click", () => {
  if (!recognition) {
    alert("Speech recognition not supported");
    return;
  }
  recognition.start();
});