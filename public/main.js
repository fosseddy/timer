"use strict"

const TimerStatePaused = 0;
const TimerStateActive = 1;
const TimerStateFinished = 2;

const timerValue = {
    elem: document.querySelector("#value"),

    update(time) {
        const hms = toHMS(time * 0.001);
        const hhmmss = hms.map(it => String(it).padStart(2, "0")).join(":");
        this.elem.textContent = hhmmss;
    }
};

const controlButton = {
    elem: document.querySelector("#control"),
    text: {
        [TimerStatePaused]: "start",
        [TimerStateActive]: "stop",
        [TimerStateFinished]: "ok",
    },

    update(timerState) {
        this.elem.textContent = this.text[timerState];
    }
};

const resetButton = document.querySelector("#reset");

const timer = {
    worker: new Worker("/timer.js"),
    state: TimerStatePaused,
    duration: 0,
    elapsed: 0,

    start() {
        this.state = TimerStateActive;
        this.worker.postMessage({ type: "start" });
    },

    stop() {
        this.state = TimerStatePaused;
        this.worker.postMessage({ type: "stop" });
    },

    finish() {
        this.state = TimerStateFinished;
        this.worker.postMessage({ type: "stop" });
    },

    reset() {
        this.elapsed = 0;
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
            this.anim = this.elem.animate(this.keyframes, this.opts);
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
        this.anim.finish();
        this.anim.cancel();
        this.anim = null;
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

    controlButton.update(timer.state);
    timerValue.update(timer.duration);
}

function updateDuration() {
    const val = picker.getValue();

    timer.duration = val;
    progress.opts.duration = val

    reset();
}

picker.elems.forEach(elem => elem.addEventListener("change", updateDuration));

resetButton.addEventListener("click", reset);

control.addEventListener("click", () => {
    switch (timer.state) {
    case TimerStatePaused:
        timer.start();
        progress.start();
        controlButton.update(timer.state);
        break;
    case TimerStateActive:
        timer.stop();
        progress.stop();
        controlButton.update(timer.state);
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

    timer.elapsed += event.data.payload;
    if (timer.elapsed > timer.duration) timer.elapsed = timer.duration;

    timerValue.update(timer.duration - timer.elapsed);

    if (timer.elapsed === timer.duration) {
        timer.finish();
        progress.stop();
        alarm.play();
        controlButton.update(timer.state);
    }
});

window.addEventListener("load", () => {
    updateDuration();
});
