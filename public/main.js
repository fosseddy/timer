"use strict"

const ClockStatePaused = 0;
const ClockStateActive = 1;
const ClockStateFinished = 2;

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
        [ClockStatePaused]: "start",
        [ClockStateActive]: "stop",
        [ClockStateFinished]: "ok",
    },

    update(timerState) {
        this.elem.textContent = this.text[timerState];
    }
};

const resetButton = document.querySelector("#reset");

const clock = {
    worker: new Worker("/clock.js"),
    state: ClockStatePaused,
    duration: 0,
    elapsed: 0,

    start() {
        this.state = ClockStateActive;
        this.worker.postMessage({ type: "start" });
    },

    stop() {
        this.state = ClockStatePaused;
        this.worker.postMessage({ type: "stop" });
    },

    finish() {
        this.state = ClockStateFinished;
        this.worker.postMessage({ type: "stop" });
    },

    reset() {
        this.elapsed = 0;
        this.state = ClockStatePaused;
        this.worker.postMessage({ type: "reset" });
    }
};

const picker = {
    elem: document.querySelector(".picker"),
    selects: document.querySelectorAll(".picker select"),
    confirmButton: document.querySelector(".picker button"),

    getValue() {
        const h = Number(this.selects[0].value);
        const m = Number(this.selects[1].value);
        const s = Number(this.selects[2].value);

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
    clock.reset();
    progress.reset();
    alarm.reset();

    controlButton.update(clock.state);
    timerValue.update(clock.duration);
}

picker.confirmButton.addEventListener("click", () => {
    const val = picker.getValue();

    clock.duration = val;
    progress.opts.duration = val

    timerValue.update(val);

    picker.elem.classList.add("hidden");
    timerValue.elem.classList.remove("hidden");
});

timerValue.elem.addEventListener("click", () => {
    reset();

    picker.elem.classList.remove("hidden");
    timerValue.elem.classList.add("hidden");
});

resetButton.addEventListener("click", reset);

controlButton.elem.addEventListener("click", () => {
    switch (clock.state) {
    case ClockStatePaused:
        clock.start();
        progress.start();
        controlButton.update(clock.state);
        break;
    case ClockStateActive:
        clock.stop();
        progress.stop();
        controlButton.update(clock.state);
        break;
    case ClockStateFinished:
        alarm.reset();
        break;
    default:
        console.error("unreachable", timerState);
        break;
    }
});

clock.worker.addEventListener("message", event => {
    if (event.data.type !== "tick") {
        console.error("unknown worker event", event.data.type);
        return;
    }

    clock.elapsed += event.data.payload;
    if (clock.elapsed > clock.duration) clock.elapsed = clock.duration;

    timerValue.update(clock.duration - clock.elapsed);

    if (clock.elapsed === clock.duration) {
        clock.finish();
        progress.stop();
        alarm.play();
        controlButton.update(clock.state);
    }
});

window.addEventListener("load", () => {
    const val = picker.getValue();

    clock.duration = val;
    progress.opts.duration = val

    timerValue.update(val);
});
