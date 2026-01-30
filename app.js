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
  if (value === "=") {
    calculate();
  } else if (value === "C") {
    screen.value = "";
  } else if (value === "√") {
    screen.value = Math.sqrt(eval(screen.value));
  } else if (value === "sin") {
    screen.value = Math.sin(toRad(eval(screen.value)));
  } else if (value === "cos") {
    screen.value = Math.cos(toRad(eval(screen.value)));
  } else if (value === "tan") {
    screen.value = Math.tan(toRad(eval(screen.value)));
  } else if (value === "log") {
    screen.value = Math.log10(eval(screen.value));
  } else if (value === "exp") {
    screen.value = Math.exp(eval(screen.value));
  } else {
    screen.value += value;
  }
}

function calculate() {
  try {
    const result = eval(screen.value);
    screen.value = result;
    speak(`Result is ${result}`);
    beep();
  } catch {
    speak("Invalid calculation");
    beep(200);
  }
}

function toRad(deg) {
  return deg * (Math.PI / 180);
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
