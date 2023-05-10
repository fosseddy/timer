<script setup>
import * as Vue from "vue";

const ClockStatePaused = 0;
const ClockStateActive = 1;
const ClockStateFinished = 2;

const clock = {
    worker: new Worker("/clock.js"),
    state: Vue.ref(ClockStatePaused),
    duration: Vue.ref(3 * 1000),
    elapsed: Vue.ref(0),

    start() {
        this.state.value = ClockStateActive;
        this.worker.postMessage({ type: "start" });
    },

    stop() {
        this.state.value = ClockStatePaused;
        this.worker.postMessage({ type: "stop" });
    },

    finish() {
        this.state.value = ClockStateFinished;
        this.worker.postMessage({ type: "stop" });
    },

    reset() {
        this.elapsed.value = 0;
        this.state.value = ClockStatePaused;
        this.worker.postMessage({ type: "reset" });
    }
}

const progressRef = Vue.ref(null);
const progress = {
    ref: progressRef,
    anim: null,
    keyframes: [{ width: "0%" }, { width: "100%" }],
    opts: { duration: clock.duration.value, fill: "forwards" },

    start() {
        if (!this.anim) {
            this.anim = this.ref.value.animate(this.keyframes, this.opts);
        } else {
            this.anim.play();
        }
        this.ref.value.classList.remove("progress-stopped");
    },

    stop() {
        if (!this.anim) return;
        this.anim.pause();
        this.ref.value.classList.add("progress-stopped");
    },

    reset() {
        if (!this.anim) return;
        this.anim.finish();
        this.anim.cancel();
        this.anim = null;
    }
};

const audioRef = Vue.ref(null);
const alarm = {
    ref: audioRef,

    play() {
        this.ref.value.play().catch(console.error);
    },

    reset() {
        this.ref.value.pause();
        this.ref.value.currentTime = 0;
    }
};

function startTimer() {
    clock.start();
    progress.start();
}

function stopTimer() {
    if (clock.state.value === ClockStateFinished) {
        resetTimer();
        return;
    }

    clock.stop();
    progress.stop();
}

function resetTimer() {
    clock.reset();
    progress.reset();
    alarm.reset();
}

function hhmmss(ms) {
    const secs = ms * 0.001;
    const hms = [
        Math.floor(secs / 3600),
        Math.floor(secs % 3600 / 60),
        Math.floor(secs % 60)
    ];

    return hms.map(it => String(it).padStart(2, "0")).join(":");
}

clock.worker.addEventListener("message", () => {
    if (event.data.type !== "tick") {
        console.error("unknown worker event", event.data.type);
        return;
    }

    let elapsed = clock.elapsed.value;
    let duration = clock.duration.value;

    elapsed += event.data.payload;
    if (elapsed >= duration) {
        elapsed = duration;

        clock.finish();
        progress.stop();
        alarm.play();
    }

    clock.elapsed.value = elapsed;
});

Vue.onUnmounted(() => clock.worker.terminate());
</script>

<template>
<div class="timer">
    <p>TIMER</p>
    <p class="time">{{ hhmmss(clock.duration.value - clock.elapsed.value) }}</p>
    <div ref="progressRef" class="progress"></div>
    <div class="controls">
        <button>set</button>
        <button @click="resetTimer">reset</button>
        <button v-if="clock.state.value === ClockStatePaused" @click="startTimer">start</button>
        <button v-else @click="stopTimer">stop</button>
    </div>
    <audio ref="audioRef" src="/alarm.ogg" loop></audio>
</div>
</template>

<style scoped>
.timer {
    min-width: 400px;
    color: var(--c-primary);
    background-color: var(--c-secondary);
}

.time {
    transform: scale(1.1);
    background-color: var(--c-primary);
    color: var(--c-fg);
    display: grid;
    place-content: center;
}

.progress {
    width: 0;
    height: .3125rem;
    background-color: red;
}

.progress-stopped {
    background-color: lightgray;
}
</style>

<style>
*,
*::after,
*::before {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

:root {
    --c-bg: #c2e8f6;
    --c-fg: #ecf0f1;
    --c-secondary: #43839a;
    --c-primary: #1b3743;
}

body {
    background: var(--c-bg);
}

#app {
    display: grid;
    place-content: center;
}
</style>
