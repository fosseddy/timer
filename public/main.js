"use strict"

const value = document.querySelector("#value");
const control = document.querySelector("#control");
const reset = document.querySelector("#reset");

const TimerStatePaused = 0;
const TimerStateActive = 1;
const TimerStateFinished = 2;

const timer = {
    worker: new Worker("/timer.js"),
    state: TimerStatePaused,
    duration: 0,

    setDuration(d) {
        this.duration = d;
        this.worker.postMessage({ type: "set-duration", payload: d });
    },

    start() {
        this.state = TimerStateActive;
        this.worker.postMessage({ type: "start" });
    },

    stop() {
        this.state = TimerStatePaused;
        this.worker.postMessage({ type: "stop" });
    },

    reset() {
        this.state = TimerStatePaused;
        this.worker.postMessage({ type: "reset" });
    }
};

const alarm = {
    elem: document.querySelector("audio"),

    play() {
        this.elem.play().catch(console.error);
    },

    reset() {
        if (this.elem.paused) return;
        this.elem.pause();
        this.elem.currentTime = 0;
    }
};

const progress = {
    anim: null,
    elem: document.querySelector(".progress"),
    keyframes: [{ width: "0%" }, { width: "100%" }],
    opts: { duration: 0, fill: "forwards" },

    start() {
        if (!this.anim) {
            this.anim = this.elem.animate(this.keyframes, this.opts)
        } else {
            this.anim.play();
        }
        this.elem.classList.remove("progress-stopped");
    },

    stop() {
        if (!this.anim) return;
        this.anim.pause();
        this.elem.classList.add("progress-stopped");
    },

    reset() {
        if (!this.anim) return;
        this.anim.cancel();
    },

    setDuration(d) {
        if (this.anim) {
            this.anim = null;
        }
        this.opts.duration = d;
    }
};

reset.addEventListener("click", () => {
    timer.reset();
    progress.reset();
    alarm.reset();

    renderControlText(control, timer.state);
    renderTime(value, timer.duration, 0);
});

control.addEventListener("click", () => {
    switch (timer.state) {
    case TimerStatePaused:
        timer.start();
        progress.start();
        renderControlText(control, timer.state);
        break;
    case TimerStateActive:
        timer.stop();
        progress.stop();
        renderControlText(control, timer.state);
        break;
    case TimerStateFinished:
        alarm.reset();
        break;
    default:
        console.error("unreachable", timerState);
        break;
    }
});

timer.worker.addEventListener("message", event => {
    if (event.data.type !== "tick") {
        console.error("unknown worker event", event.data.type);
        return;
    }

    const elapsed = event.data.payload;

    if (elapsed >= 1000) {
        renderTime(value, timer.duration, elapsed - elapsed % 1000);
    }

    if (elapsed >= timer.duration) {
        timer.state = TimerStateFinished;
        progress.stop();
        alarm.play();
        renderControlText(control, timer.state);
    }
});

function toHMS(secs) {
    return [
        Math.floor(secs / 3600),
        Math.floor(secs / 60),
        Math.floor(secs % 60)
    ];
}

function renderTime(container, duration, elap) {
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

function renderControlText(container, timerState) {
    const buttonText = {
        [TimerStatePaused]: "start",
        [TimerStateActive]: "stop",
        [TimerStateFinished]: "ok",
    };

    container.textContent = buttonText[timerState];
}

window.addEventListener("load", () => {
    timer.setDuration(3 * 1000);
    progress.setDuration(timer.duration);

    renderTime(value, timer.duration, 0);
});
