// ===============================
// WAIT FOR PAGE TO LOAD
// ===============================
document.addEventListener('DOMContentLoaded', function() {

// ===============================
// GET ALL DOM ELEMENTS
// ===============================
const themeToggle = document.getElementById("themeToggle");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");
const screen = document.getElementById("screen");
const buttons = document.querySelectorAll(".calc-btn");
const micBtn = document.getElementById("micBtn");
const clearBtn = document.getElementById("clearBtn");
const backspaceBtn = document.getElementById("backspaceBtn");

// Currency converter elements
const currencyAmount = document.getElementById('currencyAmount');
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const convertBtn = document.getElementById('convertBtn');
const swapBtn = document.getElementById('swapBtn');
const currencyResultDiv = document.getElementById('currencyResult');
const currencyResultText = document.getElementById('currencyResultText');
const rateStatus = document.getElementById('rateStatus');

// Debug: Check if elements exist
console.log("Screen found:", !!screen);
console.log("Buttons found:", buttons.length);
console.log("Mic button found:", !!micBtn);

// ===============================
// AUDIO
// ===============================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function beep(freq = 600) {
  const osc = audioCtx.createOscillator();
  osc.frequency.value = freq;
  osc.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.08);
}

// ===============================
// TEXT TO SPEECH
// ===============================
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  speechSynthesis.speak(utter);
}

// ===============================
// THEME TOGGLE
// ===============================
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
      speak("Dark mode activated");
    } else {
      speak("Light mode activated");
    }
  });
}

// ===============================
// HISTORY
// ===============================
if (clearHistoryBtn && historyList) {
  clearHistoryBtn.addEventListener("click", () => {
    historyList.innerHTML = "";
    localStorage.removeItem("calcHistory");
    speak("History cleared");
    beep(400);
  });
}

function addToHistory(expression, result) {
  if (!historyList) return;
  
  const li = document.createElement("li");
  li.textContent = `${expression} = ${result}`;
  historyList.prepend(li);

  if (historyList.children.length > 10) {
    historyList.removeChild(historyList.lastChild);
  }
}

// ===============================
// HELPER FUNCTIONS
// ===============================
function degToRad(deg) {
  return deg * Math.PI / 180;
}

function autoCloseBrackets(expr) {
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  const missingBrackets = open - close;
  
  if (missingBrackets > 0) {
    expr = expr + ")".repeat(missingBrackets);
  }
  
  return expr;
}

function isValidExpression(expr) {
  const invalidPatterns = [
    /Math\.\w+\(\s*$/,
    /degToRad\(\s*$/,
    /[\+\-\*\/]\s*$/,
  ];
  
  for (let pattern of invalidPatterns) {
    if (pattern.test(expr)) {
      return false;
    }
  }
  
  return true;
}

// ===============================
// CALCULATOR BUTTONS
// ===============================
if (clearBtn && screen) {
  clearBtn.addEventListener("click", () => {
    screen.value = "";
    beep(400);
  });
}

if (backspaceBtn && screen) {
  backspaceBtn.addEventListener("click", () => {
    screen.value = screen.value.slice(0, -1);
    beep(500);
  });
}

if (screen) {
  screen.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      beep(500);
    }
  });
}

// Calculator button handlers
if (buttons && screen) {
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      console.log("Button clicked:", btn.textContent);
      handleInput(btn.textContent);
    });
  });
}

function handleInput(value) {
  if (!screen) return;
  
  switch (value) {
    case "C":
      screen.value = "";
      beep(400);
      return;

    case "=":
      calculate();
      return;

    case "sin":
      screen.value += "Math.sin(degToRad(";
      return;

    case "cos":
      screen.value += "Math.cos(degToRad(";
      return;

    case "tan":
      screen.value += "Math.tan(degToRad(";
      return;

    case "log":
      screen.value += "Math.log10(";
      return;

    case "√":
      screen.value += "Math.sqrt(";
      return;

    case "exp":
      screen.value += "Math.exp(";
      return;

    case "^":
      screen.value += "**";
      return;

    default:
      screen.value += value;
  }
}

function calculate() {
  if (!screen) return;
  
  try {
    let expression = screen.value;
    
    if (!expression || expression.trim() === "") {
      return;
    }
    
    expression = autoCloseBrackets(expression);
    
    if (!isValidExpression(expression)) {
      throw "Incomplete expression";
    }
    
    console.log("Calculating:", expression);
    
    const result = eval(expression);

    if (isNaN(result)) {
      throw "Invalid result";
    }
    
    if (!isFinite(result)) {
      screen.value = "Infinity";
      addToHistory(expression, "Infinity");
      speak("Result is infinity");
      return;
    }
    
    if (Math.abs(result) > 1e15) {
      screen.value = "Infinity";
      addToHistory(expression, "Infinity");
      speak("Result is infinity");
      return;
    }

    const rounded = Number(result.toFixed(2));
    screen.value = rounded;
    addToHistory(expression, rounded);
    speak(`Result is ${rounded}`);
  } catch (err) {
    console.error("Calculation error:", err);
    screen.value = "Error";
    speak("Invalid expression");
    beep(200);
    
    setTimeout(() => {
      screen.value = "";
    }, 1500);
  }
}

// ===============================
// CURRENCY CONVERTER
// ===============================
let exchangeRates = {
  USD: 1,
  INR: 83.12,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  AUD: 1.52,
  CAD: 1.36,
  CNY: 7.24,
};

let lastRateUpdate = null;

const currencyAliases = {
  'dollar': 'USD', 'dollars': 'USD', 'usd': 'USD',
  'rupee': 'INR', 'rupees': 'INR', 'inr': 'INR', 'indian rupee': 'INR', 'indian rupees': 'INR',
  'euro': 'EUR', 'euros': 'EUR', 'eur': 'EUR',
  'pound': 'GBP', 'pounds': 'GBP', 'gbp': 'GBP', 'british pound': 'GBP',
  'yen': 'JPY', 'jpy': 'JPY', 'japanese yen': 'JPY',
  'australian dollar': 'AUD', 'aud': 'AUD',
  'canadian dollar': 'CAD', 'cad': 'CAD',
  'yuan': 'CNY', 'cny': 'CNY', 'chinese yuan': 'CNY',
};

async function updateExchangeRates() {
  try {
    console.log("Fetching live exchange rates...");
    if (rateStatus) rateStatus.textContent = "Updating rates...";
    
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const data = await response.json();
    
    exchangeRates = {
      USD: 1,
      ...data.rates
    };
    
    lastRateUpdate = new Date();
    
    console.log("✅ Exchange rates updated:", exchangeRates);
    if (rateStatus) rateStatus.textContent = `Rates updated at ${lastRateUpdate.toLocaleTimeString()}`;
    
  } catch (error) {
    console.error("❌ Failed to fetch exchange rates:", error);
    if (rateStatus) rateStatus.textContent = "Using offline rates";
  }
}

function convertCurrency(amount, from, to) {
  if (!exchangeRates[from] || !exchangeRates[to]) {
    return null;
  }
  
  const amountInUSD = amount / exchangeRates[from];
  const convertedAmount = amountInUSD * exchangeRates[to];
  
  return convertedAmount;
}

if (convertBtn) {
  convertBtn.addEventListener('click', () => {
    const amount = parseFloat(currencyAmount.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;
    
    if (isNaN(amount) || amount <= 0) {
      if (currencyResultText) currencyResultText.textContent = "Please enter a valid amount";
      if (currencyResultDiv) currencyResultDiv.className = "currency-result error";
      speak("Please enter a valid amount");
      return;
    }
    
    const result = convertCurrency(amount, from, to);
    
    if (result !== null) {
      const rounded = result.toFixed(2);
      const formattedResult = new Intl.NumberFormat('en-US').format(rounded);
      
      if (currencyResultText) currencyResultText.textContent = `${amount} ${from} = ${formattedResult} ${to}`;
      if (currencyResultDiv) currencyResultDiv.className = "currency-result success";
      
      speak(`${amount} ${from} equals ${rounded} ${to}`);
      beep(700);
    } else {
      if (currencyResultText) currencyResultText.textContent = "Conversion failed";
      if (currencyResultDiv) currencyResultDiv.className = "currency-result error";
    }
  });
}

if (swapBtn) {
  swapBtn.addEventListener('click', () => {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    beep(600);
  });
}


function handleCurrencyConversion(text) {
  // More flexible patterns
  const patterns = [
    // "100 dollars to rupees"
    /(\d+(?:\.\d+)?)\s*(\w+(?:\s+\w+)?)\s+(?:to|in|into|2)\s+(\w+(?:\s+\w+)?)/i,
    // "convert 100 dollars to rupees"
    /convert\s+(\d+(?:\.\d+)?)\s*(\w+(?:\s+\w+)?)\s+(?:to|in|into|2)\s+(\w+(?:\s+\w+)?)/i,
    // "100 USD to INR"
    /(\d+(?:\.\d+)?)\s*([a-z]{3})\s+(?:to|in|into|2)\s+([a-z]{3})/i,
  ];

  console.log("Checking currency conversion for:", text);

  for (let pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      console.log("Pattern matched:", match);
      
      const amount = parseFloat(match[1]);
      let from = match[2].toLowerCase().trim();
      let to = match[3].toLowerCase().trim();

      console.log("Before alias lookup - From:", from, "To:", to);

      // Convert aliases to currency codes
      from = currencyAliases[from] || from.toUpperCase();
      to = currencyAliases[to] || to.toUpperCase();

      console.log("After alias lookup - From:", from, "To:", to);

      const result = convertCurrency(amount, from, to);

      if (result !== null) {
        const rounded = result.toFixed(2);
        
        if (currencyAmount) currencyAmount.value = amount;
        if (fromCurrency) fromCurrency.value = from;
        if (toCurrency) toCurrency.value = to;
        
        const formattedResult = new Intl.NumberFormat('en-US').format(rounded);
        if (currencyResultText) currencyResultText.textContent = `${amount} ${from} = ${formattedResult} ${to}`;
        if (currencyResultDiv) currencyResultDiv.className = "currency-result success";
        
        speak(`${amount} ${from} equals ${rounded} ${to}`);
        
        return true;
      } else {
        console.log("Currency codes not found in exchangeRates");
        console.log("Available currencies:", Object.keys(exchangeRates));
        speak("Sorry, I don't recognize those currencies");
        return true;
      }
    }
  }
  
  console.log("No currency pattern matched");
  return false;
}

// Initialize exchange rates
updateExchangeRates();
setInterval(updateExchangeRates, 60 * 60 * 1000);

// ===============================
// VOICE RECOGNITION
// ===============================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;

  let isProcessing = false;

  micBtn.addEventListener("click", () => {
    if (isProcessing) return;
    
    recognition.start();
    micBtn.classList.add("listening");
    beep(900);
  });

  recognition.onresult = function(event) {
    if (isProcessing) return;
    
    isProcessing = true;
    
    const transcript = event.results[0][0].transcript;
    micBtn.classList.remove("listening");
    calculateFromVoiceAI(transcript);
    
    setTimeout(() => {
      isProcessing = false;
    }, 1000);
alert("VOICE HEARD: " + transcript);
  };

  recognition.onend = function() {
    micBtn.classList.remove("listening");
    setTimeout(() => {
      isProcessing = false;
    }, 500);
  };

  recognition.onerror = function(event) {
    micBtn.classList.remove("listening");
    speak("Voice error");
    isProcessing = false;
  };
}

function calculateFromVoiceAI(text) {
  try {
    let expr = text.toLowerCase().trim();
    console.log("VOICE INPUT:", expr);
// ---------- CURRENCY NORMALIZATION ----------
expr = expr
  .replace(/\brupees?\b/g, "inr")
  .replace(/\bindian rupees?\b/g, "inr")
  .replace(/\bdollars?\b/g, "usd")
  .replace(/\bus dollars?\b/g, "usd")
  .replace(/\beuros?\b/g, "eur")
  .replace(/\bpounds?\b/g, "gbp")
  .replace(/\byen\b/g, "jpy")
  .replace(/\bto\b/g, " to ")
  .replace(/\bin\b/g, " to ");

    if (handleCurrencyConversion(expr)) {
      return;
    }

    expr = expr
      .replace(/oneplus/g, "one plus")
      .replace(/twoplus/g, "two plus")
      .replace(/threeplus/g, "three plus")
      .replace(/fourplus/g, "four plus")
      .replace(/fiveplus/g, "five plus")
      .replace(/sixplus/g, "six plus")
      .replace(/sevenplus/g, "seven plus")
      .replace(/eightplus/g, "eight plus")
      .replace(/nineplus/g, "nine plus")
      .replace(/tenplus/g, "ten plus");

    const numbers = {
      zero: 0, one: 1, two: 2, three: 3, four: 4,
      five: 5, six: 6, seven: 7, eight: 8, nine: 9,
      ten: 10
    };

    expr = expr
      .replace(/\bcause\b/g, "cos")
      .replace(/\bcourse\b/g, "cos")
      .replace(/\broute\b/g, "root")
      .replace(/\bsquare root of\b/g, "root")
      .replace(/\bsquare root\b/g, "root");

    expr = expr
      .replace(/\bplus\b/g, "+")
      .replace(/\bminus\b/g, "-")
      .replace(/\btimes|multiply|multiplied by|into\b/g, "*")
      .replace(/\bdivide|divided by|over\b/g, "/")
      .replace(/\bpower|to the power of|raised\b/g, "**")
      .replace(/\bequals|equal to\b/g, "");

    Object.keys(numbers).forEach(word => {
      const re = new RegExp("\\b" + word + "\\b", "g");
      expr = expr.replace(re, numbers[word]);
    });

    expr = expr
      .replace(/\badd (\d+) and (\d+)\b/g, "$1+$2")
      .replace(/\bsubtract (\d+) from (\d+)\b/g, "$2-$1")
      .replace(/\bmultiply (\d+) and (\d+)\b/g, "$1*$2")
      .replace(/\bdivide (\d+) by (\d+)\b/g, "$1/$2");

    expr = expr.replace(/\s*√\s*/g, "√");
    expr = expr.replace(/(\d+)?√(\d+(\.\d+)?)/g, (_, num1, num2) => {
      if (num1) return `${num1}*Math.sqrt(${num2})`;
      return `Math.sqrt(${num2})`;
    });
    expr = expr.replace(/root\s*(\d+(\.\d+)?)/g, "Math.sqrt($1)");

    expr = expr
      .replace(/\bexponent\s*(\d+(\.\d+)?)/g, "Math.exp($1)")
      .replace(/\bexponent(\d+(\.\d+)?)/g, "Math.exp($1)")
      .replace(/\bexp\s*(\d+(\.\d+)?)/g, "Math.exp($1)")
      .replace(/\bexp(\d+(\.\d+)?)/g, "Math.exp($1)")
      .replace(/\bsin\s*(\d+(\.\d+)?)/g, "Math.sin(degToRad($1))")
      .replace(/\bcos\s*(\d+(\.\d+)?)/g, "Math.cos(degToRad($1))")
      .replace(/\btan\s*(\d+(\.\d+)?)/g, "Math.tan(degToRad($1))")
      .replace(/\blog\s*(\d+(\.\d+)?)/g, "Math.log10($1)")
      .replace(/\bln\s*(\d+(\.\d+)?)/g, "Math.log($1)")
      .replace(/\bpi\b/g, "Math.PI");

    expr = expr.replace(/\s+/g, "");

    console.log("NORMALIZED:", expr);

    if (/^[0-9+\-*/().]+$/.test(expr)) {
      const result = eval(expr);
      if (!isNaN(result)) {
        const rounded = Number(result.toFixed(2));
        if (screen) screen.value = rounded;
        addToHistory(expr, rounded);
        speak(`The answer is ${rounded}`);
        return;
      }
    }

    expr = autoCloseBrackets(expr);

    const result = eval(expr);
    if (isNaN(result)) throw "Invalid";

    const rounded = Number(result.toFixed(2));
    if (screen) screen.value = rounded;
    addToHistory(expr, rounded);
    speak(`The answer is ${rounded}`);
    
  } catch (err) {
    console.error(err);
    speak("Sorry, I couldn't understand");
    beep(200);
  }
}

console.log("✅ Calculator fully loaded!");

}); // End DOMContentLoaded
