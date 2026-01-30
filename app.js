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

recognition.onresult = e => {
  const speech = e.results[0][0].transcript.toLowerCase();
  micBtn.classList.remove("listening");
  parseVoice(speech);
};

recognition.onerror = () => {
  micBtn.classList.remove("listening");
  speak("Voice error");
};

function parseVoice(text) {
  try {
    let expr = text
      .replace(/plus/g, "+")
      .replace(/minus/g, "-")
      .replace(/times|multiply/g, "*")
      .replace(/divide|by/g, "/")
      .replace(/power/g, "**")
      .replace(/square root of/g, "Math.sqrt");

    screen.value = eval(expr);
    speak(`Result is ${screen.value}`);
  } catch {
    speak("Sorry, I couldn't understand");
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
