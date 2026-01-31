// ---------- THEME & UI ----------
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
        speak("Dark mode activated");
    } else {
        speak("Light mode activated");
    }
});

const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

clearHistoryBtn.addEventListener("click", () => {
    historyList.innerHTML = "";
    localStorage.removeItem("calcHistory");
    speak("History cleared");
    beep(400);
});

const screen = document.getElementById("screen");
const buttons = document.querySelectorAll(".calc-btn");
const micBtn = document.getElementById("micBtn");
const clearBtn = document.getElementById("clearBtn");
const backspaceBtn = document.getElementById("backspaceBtn");

clearBtn.addEventListener("click", () => {
    screen.value = "";
    beep(400);
});

backspaceBtn.addEventListener("click", () => {
    screen.value = screen.value.slice(0, -1);
    beep(500);
});

// --------- AUDIO & SPEECH ---------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq = 600) {
    const osc = audioCtx.createOscillator();
    osc.frequency.value = freq;
    osc.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
}

function speak(text) {
    const utter = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utter);
}

// --------- MATH HELPERS ---------
function degToRad(deg) { return deg * Math.PI / 180; }

function autoCloseBrackets(expr) {
    const open = (expr.match(/\(/g) || []).length;
    const close = (expr.match(/\)/g) || []).length;
    const missingBrackets = open - close;
    if (missingBrackets > 0) expr = expr + ")".repeat(missingBrackets);
    return expr;
}

// --------- CALCULATOR LOGIC ---------
buttons.forEach(btn => {
    btn.addEventListener("click", () => handleInput(btn.textContent.trim()));
});

function handleInput(value) {
    switch (value) {
        case "C": screen.value = ""; beep(400); break;
        case "=": calculate(); break;
        case "sin": screen.value += "Math.sin(degToRad("; break;
        case "cos": screen.value += "Math.cos(degToRad("; break;
        case "tan": screen.value += "Math.tan(degToRad("; break;
        case "log": screen.value += "Math.log10("; break;
        case "√": screen.value += "Math.sqrt("; break;
        case "exp": screen.value += "Math.exp("; break;
        case "^": screen.value += "**"; break;
        default: screen.value += value;
    }
}

function calculate() {
    try {
        let expression = screen.value;
        if (!expression) return;
        expression = autoCloseBrackets(expression);
        const result = eval(expression);
        if (isNaN(result) || !isFinite(result)) throw "Invalid";
        
        const rounded = Number(result.toFixed(2));
        screen.value = rounded;
        addToHistory(expression, rounded);
        speak(`Result is ${rounded}`);
    } catch (err) {
        screen.value = "Error";
        speak("Invalid expression");
        setTimeout(() => screen.value = "", 1500);
    }
}

function addToHistory(expression, result) {
    const li = document.createElement("li");
    li.textContent = `${expression} = ${result}`;
    historyList.prepend(li);
}

// --------- CURRENCY LOGIC ---------
let exchangeRates = { USD: 1, INR: 83, EUR: 0.92 };

async function updateExchangeRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        exchangeRates = data.rates;
    } catch (e) { console.log("Using fallback rates"); }
}
updateExchangeRates();

function convertCurrency(amount, from, to) {
    if (!exchangeRates[from] || !exchangeRates[to]) return null;
    return (amount / exchangeRates[from]) * exchangeRates[to];
}

// Add event listeners for your currency buttons (convertBtn, swapBtn) here as per your original logic.
