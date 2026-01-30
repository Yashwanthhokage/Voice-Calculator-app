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
  screen.value = "";    // Clear the display
  beep(400);            // Feedback sound
});

// ❌ REMOVED DUPLICATE - This was causing double input
// buttons.forEach(btn => {
//   btn.addEventListener("click", () => handleInput(btn.textContent));
// });

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

// --------- CALCULATOR ---------
// ✅ KEEP ONLY ONE EVENT LISTENER
buttons.forEach(btn => {
  btn.addEventListener("click", () => handleInput(btn.textContent));
});

function handleInput(value) {
  switch (value) {

    case "C":
      screen.value = "";
      beep(400); // Added feedback sound
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
  try {
    const expression = autoCloseBrackets(screen.value);
    const result = eval(expression);

    if (isNaN(result)) throw "NaN";

    const rounded = Number(result.toFixed(2));
    screen.value = rounded;
    addToHistory(expression, rounded);
    speak(`Result is ${rounded}`);
  } catch {
    screen.value = "Error";
    speak("Invalid scientific expression");
    beep(200);
  }
}

// --------- VOICE INPUT ---------
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.continuous = false;

micBtn.addEventListener("click", () => {
  recognition.start();
  micBtn.classList.add("listening");
  beep(900);
});

recognition.onresult = function(event) {
  const transcript = event.results[0][0].transcript;
  calculateFromVoiceAI(transcript); // ✅ new AI parser
};
recognition.onerror = () => {
  micBtn.classList.remove("listening");
  speak("Voice error");
};
function degToRad(deg) {
  return deg * Math.PI / 180;
}
function autoCloseBrackets(expr) {
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  return expr + ")".repeat(open - close);
}
function calculateFromVoiceAI(text) {
  try {
    let expr = text.toLowerCase().trim();

    console.log("VOICE INPUT:", expr);

    // ---------- NUMBER WORDS ----------
    const numbers = {
      zero:0, one:1, two:2, three:3, four:4,
      five:5, six:6, seven:7, eight:8, nine:9,
      ten:10
    };

    Object.keys(numbers).forEach(word => {
      const re = new RegExp("\\b" + word + "\\b", "g");
      expr = expr.replace(re, numbers[word]);
    });

    // ---------- BASIC OPERATORS ----------
    expr = expr
      .replace(/\bplus\b/g, "+")
      .replace(/\bminus\b/g, "-")
      .replace(/\btimes|multiply|into\b/g, "*")
      .replace(/\bdivide|divided by\b/g, "/")
      .replace(/\bequals|equal to\b/g, "");

    // ---------- CLEAN ----------
    expr = expr.replace(/\s+/g, "");

    console.log("NORMALIZED:", expr);

    // ---------- DIRECT EVAL ----------
    if (/^[0-9+\-*/().]+$/.test(expr)) {
      const result = eval(expr);
      if (!isNaN(result)) {
        const rounded = Number(result.toFixed(2));
        screen.value = rounded;
        addToHistory(expr, rounded);
        speak(`The answer is ${rounded}`);
        return;
      }
    }

    throw "Not basic math";
    // ---------- NORMALIZE COMMON MISHEARS ----------
    expr = expr
      .replace(/\bcause\b/g, "cos")
      .replace(/\bcourse\b/g, "cos")
      .replace(/\broute\b/g, "root")
      .replace(/\bsquare root of\b/g, "root")
      .replace(/\bsquare root\b/g, "root");

    // ---------- OPERATORS ----------
    expr = expr
      .replace(/\bplus\b/g, "+")
      .replace(/\bminus\b/g, "-")
      .replace(/\btimes|multiply|multiplied by|into\b/g, "*")
      .replace(/\bdivide|divided by|over\b/g, "/")
      .replace(/\bpower|to the power of|raised\b/g, "**");

    // ---------- HANDLE SHORTHAND √ EXPRESSIONS ----------
    // remove spaces in cases like "5 √ 5" -> "5√5"
    expr = expr.replace(/\s*√\s*/g, "√");

    // 5√5 -> 5*Math.sqrt(5), √16 -> Math.sqrt(16)
    expr = expr.replace(/(\d+)?√(\d+(\.\d+)?)/g, (_, num1, num2) => {
      if (num1) return `${num1}*Math.sqrt(${num2})`;
      return `Math.sqrt(${num2})`;
    });

    // root 25 -> Math.sqrt(25)
    expr = expr.replace(/root\s*(\d+(\.\d+)?)/g, "Math.sqrt($1)");

    // ---------- SCIENTIFIC FUNCTIONS ----------
    expr = expr
      .replace(/\bsin\s*(\d+(\.\d+)?)/g, "Math.sin(degToRad($1))")
      .replace(/\bcos\s*(\d+(\.\d+)?)/g, "Math.cos(degToRad($1))")
      .replace(/\btan\s*(\d+(\.\d+)?)/g, "Math.tan(degToRad($1))")
      .replace(/\blog\s*(\d+(\.\d+)?)/g, "Math.log10($1)")
      .replace(/\bln\s*(\d+(\.\d+)?)/g, "Math.log($1)")
      .replace(/\bexp\s*(\d+(\.\d+)?)/g, "Math.exp($1)")
      .replace(/\bpi\b/g, "Math.PI")
      .replace(/\be\b/g, "Math.E");

    // ---------- SMART PHRASES ----------
    expr = expr
      .replace(/\badd (\d+) and (\d+)\b/g, "$1+$2")
      .replace(/\bsubtract (\d+) from (\d+)\b/g, "$2-$1")
      .replace(/\bmultiply (\d+) and (\d+)\b/g, "$1*$2")
      .replace(/\bdivide (\d+) by (\d+)\b/g, "$1/$2");

    // ---------- CLEAN SPACES ----------
    expr = expr.replace(/\s+/g, "");

    // ---------- AUTO-CLOSE BRACKETS ----------
    expr = autoCloseBrackets(expr);

    // ---------- EVALUATE ----------
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
function addToHistory(expression, result) {
  const li = document.createElement("li");
  li.textContent = `${expression} = ${result}`;
  historyList.prepend(li);

  // Limit history to last 10 entries
  if (historyList.children.length > 10) {
    historyList.removeChild(historyList.lastChild);
  }
  }
