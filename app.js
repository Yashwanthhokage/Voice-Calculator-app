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

recognition.onresult = function (event) {
  const transcript = event.results[0][0].transcript;

  alert("VOICE HEARD: " + transcript);   // 🔴 IMPORTANT
  console.log("VOICE HEARD:", transcript);

  parseVoice(transcript);
};
recognition.onerror = () => {
  micBtn.classList.remove("listening");
  speak("Voice error");
};
function parseVoice(text) {
  console.log("VOICE RAW:", text);

  try {
    let expr = text.toLowerCase();

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
