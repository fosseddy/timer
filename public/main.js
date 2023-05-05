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
        let hms = toHMS(t * 0.001);
        hms = hms.map(it => String(it).padStart(2, "0")).join(":");
        this.timerValue.textContent = hms;
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

const picker = {
    elems: document.querySelectorAll(".picker select"),

    getValue() {
        const h = Number(this.elems[0].value);
        const m = Number(this.elems[1].value);
        const s = Number(this.elems[2].value);

        return (h * 3600 + m * 60 + s) * 1000;
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
        this.anim = null;
    },

    setDuration(d) {
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

function reset() {
    timer.reset();
    progress.reset();
    alarm.reset();

    ui.renderControlButton(timer.state);
    ui.renderTime(timer.duration);
}

function updateDuration() {
    const val = picker.getValue();

    timer.setDuration(val);
    progress.setDuration(val);

    reset();
}

picker.elems.forEach(elem => elem.addEventListener("change", updateDuration));

ui.resetButton.addEventListener("click", reset);

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
    updateDuration();
});
