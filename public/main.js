const timer = new Worker("/timer.js");

const value = document.querySelector("#value");
const progress = document.querySelector("#progress");
const control = document.querySelector("#control");
const reset = document.querySelector("#reset");

const alarm = new Audio("/alarm.ogg");
alarm.loop = true;

const TimerStatePaused = 0;
const TimerStateActive = 1;
const TimerStateFinished = 2;

const duration = 5 * 1000;
let timerState = TimerStatePaused;

control.addEventListener("click", () => {
    switch (timerState) {
    case TimerStatePaused:
        setTimerState(TimerStateActive);
        timer.postMessage({ type: "start" });
        break;
    case TimerStateActive:
        setTimerState(TimerStatePaused);
        timer.postMessage({ type: "stop" });
        break;
    case TimerStateFinished:
        resetAlarm();
        break;
    default:
        console.error("unreachable", timerState);
        break;
    }
});

reset.addEventListener("click", () => {
    setTimerState(TimerStatePaused);
    timer.postMessage({ type: "reset" });
    resetAlarm();
    progress.value = 0;
    renderTime(value, 0);
});

timer.addEventListener("message", event => {
    console.assert(event.data.type === "tick");

    const elapsed = event.data.payload;

    progress.value = elapsed;

    if (elapsed >= 1000) {
        renderTime(value, elapsed - elapsed % 1000);
    }

    if (elapsed >= duration) {
        setTimerState(TimerStateFinished);
        alarm.play().catch(console.error);
    }
});

function toHMS(secs) {
    return [
        Math.floor(secs / 3600),
        Math.floor(secs / 60),
        Math.floor(secs % 60)
    ];
}

function renderTime(container, elap) {
    const [h, m, s] = toHMS((duration - elap) * 0.001);
    let value = "";

    if (h > 0) {
        value += `${h}h `;
    }

    if (m > 0) {
        value += `${m}m `;
    }

    value += `${s}s`;

    container.textContent = value;
}

function setTimerState(s) {
    const buttonText = {
        [TimerStatePaused]: "start",
        [TimerStateActive]: "stop",
        [TimerStateFinished]: "ok",
    };

    timerState = s;
    control.textContent = buttonText[s];
}

function resetAlarm() {
    if (alarm.paused) return;
    alarm.pause();
    alarm.currentTime = 0;
}

renderTime(value, 0);
progress.max = duration;
progress.value = 0;
timer.postMessage({ type: "set-duration", payload: duration });
