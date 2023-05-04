const timer = new Worker("/timer.js");

const value = document.querySelector("#value");
const control = document.querySelector("#control");
const reset = document.querySelector("#reset");

const alarm = new Audio("/alarm.ogg");
alarm.loop = true;

const TimerState = {
    Paused: "paused",
    Active: "active",
    Finished: "finished"
};

const duration = 820 * 1000;
let timerState = TimerState.Paused;

control.addEventListener("click", () => {
    switch (timerState) {
    case TimerState.Paused:
        setTimerState(TimerState.Active);
        timer.postMessage({ type: "start" });
        break;
    case TimerState.Active:
        setTimerState(TimerState.Paused);
        timer.postMessage({ type: "stop" });
        break;
    case TimerState.Finished:
        if (alarm.paused) return;
        alarm.pause();
        alarm.currentTime = 0;
        break;
    default:
        console.error("unreachable", timerState);
        break;
    }
});

reset.addEventListener("click", () => {
    setTimerState(TimerState.Paused);
    timer.postMessage({ type: "reset" });
    renderTime(value, 0);
});

timer.addEventListener("message", event => {
    console.assert(event.data.type === "tick");

    const elapsed = event.data.payload;

    if (elapsed >= 1000) {
        renderTime(value, elapsed - elapsed % 1000);
    }

    if (elapsed >= duration) {
        setTimerState(TimerState.Finished);
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
        [TimerState.Paused]: "start",
        [TimerState.Active]: "stop",
        [TimerState.Finished]: "ok",
    };

    timerState = s;
    control.textContent = buttonText[s];
}

renderTime(value, 0);
timer.postMessage({ type: "set-duration", payload: duration });
