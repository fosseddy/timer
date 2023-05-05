"use strict"

const TimerStatePaused = 0;
const TimerStateActive = 1;
const TimerStateFinished = 2;

const ui = {
    timerValue: document.querySelector("#value"),
    resetButton: document.querySelector("#reset"),
    controlButton: document.querySelector("#control"),
    controlButtonText: {
        [TimerStatePaused]: "start",
        [TimerStateActive]: "stop",
        [TimerStateFinished]: "ok",
    },

    renderTime(t) {
        const [h, m, s] = toHMS(t * 0.001);
        let value = "";

        if (h > 0) {
            value += `${h}h `;
        }

        if (m > 0 || h > 0) {
            value += `${m}m `;
        }

        value += `${s}s`;

        this.timerValue.textContent = value;
    },

    renderControlButton(timerState) {
        this.controlButton.textContent = this.controlButtonText[timerState];
    }
};

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

const alarm = {
    audio: document.querySelector("audio"),

    play() {
        this.audio.play().catch(console.error);
    },

    reset() {
        if (this.audio.paused) return;
        this.audio.pause();
        this.audio.currentTime = 0;
    }
};

function toHMS(secs) {
    return [
        Math.floor(secs / 3600),
        Math.floor(secs % 3600 / 60),
        Math.floor(secs % 60)
    ];
}

ui.resetButton.addEventListener("click", () => {
    timer.reset();
    progress.reset();
    alarm.reset();

    ui.renderControlButton(timer.state);
    ui.renderTime(timer.duration);
});

control.addEventListener("click", () => {
    switch (timer.state) {
    case TimerStatePaused:
        timer.start();
        progress.start();
        ui.renderControlButton(timer.state);
        break;
    case TimerStateActive:
        timer.stop();
        progress.stop();
        ui.renderControlButton(timer.state);
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
        ui.renderTime(timer.duration - (elapsed - elapsed % 1000));
    }

    if (elapsed >= timer.duration) {
        timer.state = TimerStateFinished;
        progress.stop();
        alarm.play();
        ui.renderControlButton(timer.state);
    }
});

window.addEventListener("load", () => {
    timer.setDuration(5 * 1000);
    progress.setDuration(timer.duration);

    ui.renderTime(timer.duration);
});
