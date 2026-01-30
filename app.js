const screen = document.getElementById("screen");
const buttons = document.querySelectorAll("button");
const micBtn = document.getElementById("micBtn");
const clearBtn = document.getElementById("clearBtn");

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
buttons.forEach(btn => {
  btn.addEventListener("click", () => handleInput(btn.textContent));
});

function handleInput(value) {
  switch (value) {

    case "C":
      screen.value = "";
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

    screen.value = result;
    speak(`Result is ${result}`);
    beep();
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
function parseVoice(text) {
  console.log("VOICE RAW:", text);

  try {
    let expr = text.toLowerCase();

    /* ---------- HANDLE v AS √ ---------- */
    // v2  -> Math.sqrt(2)
    expr = expr.replace(/v(\d+)/g, "Math.sqrt($1)");

    // 2v2 -> 2*Math.sqrt(2)
    expr = expr.replace(/(\d+)math\.sqrt/g, "$1*Math.sqrt");

    /* ---------- NORMALIZE SPEECH ---------- */
    expr = expr
      .replace(/route|root|roof|routh/g, "root")
      .replace(/squire|square|squared/g, "square")
      .replace(/of/g, "")
      .replace(/what is|calculate|find/g, "");

    /* ---------- NORMALIZE COMMON MISHEARS ---------- */
    expr = expr
      .replace(/route|root|roof|routh/g, "root")
      .replace(/squire|square|squared/g, "square")
      .replace(/of/g, "")
      .replace(/what is|calculate|find/g, "");

    /* ---------- NUMBER WORDS ---------- */
    const numbers = {
      zero: 0, one: 1, two: 2, three: 3, four: 4,
      five: 5, six: 6, seven: 7, eight: 8, nine: 9,
      ten: 10
    };

    Object.keys(numbers).forEach(word => {
      expr = expr.replaceAll(word, numbers[word]);
    });

    /* ---------- OPERATORS ---------- */
    expr = expr
      .replace(/plus/g, "+")
      .replace(/minus/g, "-")
      .replace(/times|multiply|into/g, "*")
      .replace(/divide|divided/g, "/")
      .replace(/power|raised/g, "**");

    /* ---------- SCIENTIFIC ---------- */
    expr = expr
      .replace(/square root|root/g, "Math.sqrt(")
      .replace(/logarithm|log/g, "Math.log10(")
      .replace(/exponential|exp/g, "Math.exp(")
      .replace(/sine|sin/g, "Math.sin(degToRad(")
      .replace(/cosine|cos/g, "Math.cos(degToRad(")
      .replace(/tangent|tan/g, "Math.tan(degToRad(");

    /* ---------- CLEAN ---------- */
    expr = expr.replace(/\s+/g, "");
    expr = autoCloseBrackets(expr);

    console.log("PARSED EXPR:", expr);

    const result = eval(expr);

    if (isNaN(result)) throw "NaN";

    screen.value = result;
    speak(`Result is ${result}`);
    beep();

  } catch (err) {
    console.error(err);
    speak("Sorry, I couldn't understand");
    beep(200);
  }
}
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

    // ---------- PHRASE NORMALIZATION ----------
    // Common misheard words
    expr = expr
      .replace(/\bcause\b/g, "cos")
      .replace(/\bcourse\b/g, "cos")
      .replace(/\broute\b/g, "root")
      .replace(/\bsquare root of\b/g, "root")
      .replace(/\bsquare root\b/g, "root")
      .replace(/\bplus\b/g, "+")
      .replace(/\bminus\b/g, "-")
      .replace(/\btimes|multiply|multiplied by\b/g, "*")
      .replace(/\bdivide|divided by|over\b/g, "/")
      .replace(/\bpower|to the power of\b/g, "**")
      .replace(/\bwhat is|calculate|equals|equal to|find\b/g, "");

    // ---------- ROOT HANDLING ----------
    // root 25 -> Math.sqrt(25)
    expr = expr.replace(/root\s*(\d+(\.\d+)?)/g, "Math.sqrt($1)");

    // ---------- TRIG AND LOG ----------
    expr = expr
      .replace(/sin\s*(\d+(\.\d+)?)/g, "Math.sin(toRadians($1))")
      .replace(/cos\s*(\d+(\.\d+)?)/g, "Math.cos(toRadians($1))")
      .replace(/tan\s*(\d+(\.\d+)?)/g, "Math.tan(toRadians($1))")
      .replace(/log\s*(\d+(\.\d+)?)/g, "Math.log10($1)")
      .replace(/ln\s*(\d+(\.\d+)?)/g, "Math.log($1)")
      .replace(/\bpi\b/g, "Math.PI")
      .replace(/\be\b/g, "Math.E");

    // ---------- SMART AI-PARSE ----------

    // Handle phrases like "add 2 and 3" → "2+3"
    expr = expr
      .replace(/\badd (\d+) and (\d+)\b/g, "$1+$2")
      .replace(/\bsubtract (\d+) from (\d+)\b/g, "$2-$1")
      .replace(/\bmultiply (\d+) and (\d+)\b/g, "$1*$2")
      .replace(/\bdivide (\d+) by (\d+)\b/g, "$1/$2");

    // ---------- EVALUATE ----------
    const result = Function(`return ${expr}`)();
    if (isNaN(result)) throw "Invalid";

    display.value = result;
    speak(`The answer is ${result}`);

  } catch (e) {
    console.error(e);
    speak("Sorry, I couldn't understand");
  }
}
