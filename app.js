const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  // Optional: Speak feedback
  if (document.body.classList.contains("dark-mode")) {
    speak("Dark mode activated");
  } else {
    speak("Light mode activated");
  }
});

// ---------- HISTORY ----------
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

clearHistoryBtn.addEventListener("click", () => {
  historyList.innerHTML = "";
  localStorage.removeItem("calcHistory");
  speak("History cleared");
  beep(400);
});

// ---------- SCREEN & BUTTONS ----------
const screen = document.getElementById("screen");
const buttons = document.querySelectorAll(".calc-btn");
const micBtn = document.getElementById("micBtn");
const clearBtn = document.getElementById("clearBtn");

clearBtn.addEventListener("click", () => {
  screen.value = "";
  beep(400);
});
// ---------- BACKSPACE BUTTON ----------
const backspaceBtn = document.getElementById("backspaceBtn");

backspaceBtn.addEventListener("click", () => {
  // Remove last character
  screen.value = screen.value.slice(0, -1);
  beep(500); // Higher pitch beep for backspace
});

// Optional: Also allow keyboard backspace
screen.addEventListener("keydown", (e) => {
  if (e.key === "Backspace") {
    beep(500);
  }
});

// --------- AUDIO ---------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function beep(freq = 600) {
  const osc = audioCtx.createOscillator();
  osc.frequency.value = freq;
  osc.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.08);
}

// --------- TEXT TO SPEECH ---------
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1;
  utter.pitch = 1;
  speechSynthesis.speak(utter);
}

// --------- HELPER FUNCTIONS ---------
function degToRad(deg) {
  return deg * Math.PI / 180;
}

function autoCloseBrackets(expr) {
  // Count opening and closing brackets
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  
  // Add missing closing brackets
  const missingBrackets = open - close;
  
  if (missingBrackets > 0) {
    expr = expr + ")".repeat(missingBrackets);
  }
  
  return expr;
}

// --------- CALCULATOR ---------
buttons.forEach(btn => {
  btn.addEventListener("click", () => handleInput(btn.textContent));
});

function handleInput(value) {
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
function isValidExpression(expr) {
  // Check for common invalid patterns
  const invalidPatterns = [
    /Math\.\w+\(\s*$/,  // Incomplete Math functions
    /degToRad\(\s*$/,    // Incomplete degToRad
    /[\+\-\*\/]\s*$/,    // Ends with operator
  ];
  
  for (let pattern of invalidPatterns) {
    if (pattern.test(expr)) {
      return false;
    }
  }
  
  return true;
}

function calculate() {
  try {
    let expression = screen.value;
    
    if (!expression || expression.trim() === "") {
      return;
    }
    
    expression = autoCloseBrackets(expression);
    
    // Validate before evaluating
    if (!isValidExpression(expression)) {
      throw "Incomplete expression";
    }
    
    console.log("Calculating:", expression);
    
    const result = eval(expression);

    // ✅ CHECK FOR INFINITY OR EXTREMELY LARGE NUMBERS
    if (isNaN(result)) {
      throw "Invalid result";
    }
    
    if (!isFinite(result)) {
      screen.value = "Infinity";
      addToHistory(expression, "Infinity");
      speak("Result is infinity");
      return;
    }
    
    // ✅ CHECK FOR VERY LARGE NUMBERS (treat as infinity)
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
// CURRENCY CONVERTER WITH LIVE API
// ===============================

// Exchange rates (will be updated from API)
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

// Currency aliases for voice recognition
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

// Get DOM elements
const currencyAmount = document.getElementById('currencyAmount');
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const convertBtn = document.getElementById('convertBtn');
const swapBtn = document.getElementById('swapBtn');
const currencyResultDiv = document.getElementById('currencyResult');
const currencyResultText = document.getElementById('currencyResultText');
const rateStatus = document.getElementById('rateStatus');

// Fetch live exchange rates
async function updateExchangeRates() {
  try {
    console.log("Fetching live exchange rates...");
    rateStatus.textContent = "Updating rates...";
    
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
    rateStatus.textContent = `Rates updated at ${lastRateUpdate.toLocaleTimeString()}`;
    
  } catch (error) {
    console.error("❌ Failed to fetch exchange rates:", error);
    rateStatus.textContent = "Using offline rates";
  }
}

// Convert currency
function convertCurrency(amount, from, to) {
 if (!exchangeRates[from] || !exchangeRates[to]) {
    return null;
  }
  
  const amountInUSD = amount / exchangeRates[from];
  const convertedAmount = amountInUSD * exchangeRates[to];
  
  return convertedAmount;
}

// Handle manual conversion (button click)
convertBtn.addEventListener('click', () => {
  const amount = parseFloat(currencyAmount.value);
  const from = fromCurrency.value;
  const to = toCurrency.value;
  
  if (isNaN(amount) || amount <= 0) {
    currencyResultText.textContent = "Please enter a valid amount";
    currencyResultDiv.className = "currency-result error";
    speak("Please enter a valid amount");
    return;
  }
  
  const result = convertCurrency(amount, from, to);
  
  if (result !== null) {
    const rounded = result.toFixed(2);
    const formattedResult = new Intl.NumberFormat('en-US').format(rounded);
    
    currencyResultText.textContent = `${amount} ${from} = ${formattedResult} ${to}`;
    currencyResultDiv.className = "currency-result success";
    
    speak(`${amount} ${from} equals ${rounded} ${to}`);
    beep(700);
  } else {
    currencyResultText.textContent = "Conversion failed";
    currencyResultDiv.className = "currency-result error";
  }
});

// Swap currencies
swapBtn.addEventListener('click', () => {
  const temp = fromCurrency.value;
  fromCurrency.value = toCurrency.value;
  toCurrency.value = temp;
  beep(600);
});

// Handle voice currency conversion
function handleCurrencyConversion(text) {
// Normalize currency symbols
text = text.toLowerCase();
text=text
  .replace(/\$/g, " dollar ")
  .replace(/₹/g, " rupee ")
  .replace(/€/g, " euro ")
  .replace(/£/g, " pound ");
  const patterns = [
  /(\d+(?:\.\d+)?)\s*(dollars?|rupees?|euros?|pounds?|yen|usd|inr|eur|gbp|jpy)\s+(?:to|in|into)\s+(dollars?|rupees?|euros?|pounds?|yen|usd|inr|eur|gbp|jpy)/i,
  /convert\s+(\d+(?:\.\d+)?)\s*(dollars?|rupees?|euros?|pounds?|yen|usd|inr|eur|gbp|jpy)\s+(?:to|in|into)\s+(dollars?|rupees?|euros?|pounds?|yen|usd|inr|eur|gbp|jpy)/i
];
  for (let pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      let from = match[2].toLowerCase().trim();
      let to = match[3].toLowerCase().trim();

      from = currencyAliases[from] 
    || currencyAliases[from.replace(/$s/, "")]
    || from.toUpperCase();

to = currencyAliases[to] 
    || currencyAliases[to.replace(/$s/, "")]
    || to.toUpperCase();
      const result = convertCurrency(amount, from, to);

      if (result !== null) {
        const rounded = result.toFixed(2);
        
        // Update UI
        currencyAmount.value = amount;
        fromCurrency.value = from;
        toCurrency.value = to;
        
        const formattedResult = new Intl.NumberFormat('en-US').format(rounded);
        currencyResultText.textContent = `${amount} ${from} = ${formattedResult} ${to}`;
        currencyResultDiv.className = "currency-result success";
        
        speak(`${amount} ${from} equals ${rounded} ${to}`);
        
        return true;
      } else {
        speak("Sorry, I don't recognize those currencies");
        return true;
      }
    }
  }
  
  return false;
}

// Initialize: Fetch rates on page load
updateExchangeRates();

// Update rates every hour
setInterval(updateExchangeRates, 60 * 60 * 1000);
// --------- VOICE INPUT ---------
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.continuous = false;

let isProcessing = false; // ✅ NEW: Prevent duplicate processing

micBtn.addEventListener("click", () => {
  if (isProcessing) return; // ✅ Ignore if already processing
  
  recognition.start();
  micBtn.classList.add("listening");
  beep(900);
});

recognition.onresult = function(event) {
  if (isProcessing) return; // ✅ Prevent duplicate processing
  
  isProcessing = true; // ✅ Lock processing
  
  const transcript = event.results[0][0].transcript;
  micBtn.classList.remove("listening");
  calculateFromVoiceAI(transcript);
  
  // ✅ Unlock after 1 second
  setTimeout(() => {
    isProcessing = false;
  }, 1000);
  alert("VOICE HEARD: " + transcript);
};

recognition.onend = function() {
  micBtn.classList.remove("listening");
  // ✅ Ensure unlocking even if no result
  setTimeout(() => {
    isProcessing = false;
  }, 500);
};

recognition.onerror = function(event) {
  micBtn.classList.remove("listening");
  speak("Voice error");
  isProcessing = false; // ✅ Reset on error
};
// --------- VOICE COMMAND PARSER ---------
function calculateFromVoiceAI(text) {
  try {
    let expr = text.toLowerCase().trim();
    console.log("VOICE INPUT:", expr);

    // ✅ Currency first
    if (handleCurrencyConversion(expr)) return;

    // Fix concatenated words
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
      .replace(/\bcause\b|\bcourse\b/g, "cos")
      .replace(/\broute\b/g, "root")
      .replace(/\bsquare root of\b|\bsquare root\b/g, "root")
      .replace(/\bplus\b/g, "+")
      .replace(/\bminus\b/g, "-")
      .replace(/\btimes|multiply|multiplied by|into\b/g, "*")
      .replace(/\bdivide|divided by|over\b/g, "/")
      .replace(/\bpower|to the power of|raised\b/g, "**")
      .replace(/\bequals|equal to\b/g, "");

    Object.keys(numbers).forEach(word => {
      expr = expr.replace(new RegExp("\\b" + word + "\\b", "g"), numbers[word]);
    });

    expr = expr
      .replace(/root\s*(\d+(\.\d+)?)/g, "Math.sqrt($1)")
      .replace(/\bexp\s*(\d+(\.\d+)?)/g, "Math.exp($1)")
      .replace(/\bsin\s*(\d+(\.\d+)?)/g, "Math.sin(degToRad($1))")
      .replace(/\bcos\s*(\d+(\.\d+)?)/g, "Math.cos(degToRad($1))")
      .replace(/\btan\s*(\d+(\.\d+)?)/g, "Math.tan(degToRad($1))")
      .replace(/\blog\s*(\d+(\.\d+)?)/g, "Math.log10($1)")
      .replace(/\bln\s*(\d+(\.\d+)?)/g, "Math.log($1)")
      .replace(/\bpi\b/g, "Math.PI");

    expr = expr.replace(/\s+/g, "");
    expr = autoCloseBrackets(expr);

    const result = eval(expr);
    if (isNaN(result)) throw "Invalid";

    const rounded = Number(result.toFixed(2));
    screen.value = rounded;
    addToHistory(expr, rounded);
    speak(`The answer is ${rounded}`);

  } catch (err) {
    console.error(err);
    speak("Sorry, I couldn't understand");
    beep(200);
  }
}
// --------- HISTORY ---------
function addToHistory(expression, result) {
  const li = document.createElement("li");
  li.textContent = `${expression} = ${result}`;
  historyList.prepend(li);

  // Limit history to last 10 entries
  if (historyList.children.length > 10) {
    historyList.removeChild(historyList.lastChild);
  }
}
