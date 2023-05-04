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

let timerState = TimerState.Paused;

const duration = 3 * 1000;

control.addEventListener("click", () => {
    debugger;
    switch (timerState) {
    case TimerState.Paused:
        //timer.postMessage({ type: "start" });
        control.textContent = "stop";
        timerState = TimerState.Active;
        break;
    case TimerState.Active:
        //timer.postMessage({ type: "stop" });
        control.textContent = "start";
        timerState = TimerState.Paused;
        break;
    case TimerState.Finished:
        //if (alarm.paused) return;

        //alarm.pause();
        //alarm.currentTime = 0;
        control.textContent = "ok";
        break;
    default:
        console.error("unreachable", timerState);
        break;
    }
});

reset.addEventListener("click", () => {
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
        alarm.play().catch(console.error);
    }
});

function parseTime(secs) {
    return [
        Math.floor(secs / 3600),
        Math.floor(secs / 60),
        Math.floor(secs % 60)
    ];
}

function renderTime(container, elap) {
    const [h, m, s] = parseTime((duration - elap) * 0.001);
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

renderTime(value, 0);
timer.postMessage({ type: "set-duration", payload: duration });
