<script setup>
import * as Vue from "vue";

const TimerState = {
    Paused: 0,
    Active: 1,
    Finished: 2
};

const audioElement = Vue.ref(null);

const isSettingDuration = Vue.ref(false);
const duration = {
    hours: Vue.ref(0),
    minutes: Vue.ref(0),
    seconds: Vue.ref(0)
};

const timer = {
    clock: new Worker("/clock.js"),
    alarm: audioElement,

    state: Vue.ref(TimerState.Paused),
    duration: Vue.ref(0),
    elapsed: Vue.ref(0),

    start() {
        if (this.duration.value === 0) {
            return;
        }

        this.clock.postMessage({ type: "start" });
        this.state.value = TimerState.Active;
    },

    stop() {
        if (this.state.value === TimerState.Finished) {
            this.reset();
            return;
        }

        this.clock.postMessage({ type: "stop" });
        this.state.value = TimerState.Paused;
    },

    reset() {
        this.clock.postMessage({ type: "reset" });
        this.state.value = TimerState.Paused;
        this.elapsed.value = 0;
        this.alarm.value.pause();
        this.alarm.value.currentTime = 0;
    },

    finish() {
        this.clock.postMessage({ type: "stop" });
        this.state.value = TimerState.Finished;
        this.alarm.value.play().catch(console.error);
    }
};

timer.clock.addEventListener("message", event => {
    if (event.data.type !== "tick") {
        console.error("unknown worker event", event.data.type);
        return;
    }

    let elapsed = timer.elapsed.value;
    let duration = timer.duration.value;

    elapsed += event.data.payload;
    if (elapsed >= duration) {
        elapsed = duration;
        timer.finish();
    }

    timer.elapsed.value = elapsed;
});

function hhmmss(ms) {
    const secs = ms / 1000;
    const hms = [
        Math.floor(secs / 3600),
        Math.floor(secs % 3600 / 60),
        Math.floor(secs % 60)
    ];

    return hms.map(it => padZero(it)).join(":");
}

function padZero(v) {
    return String(v).padStart(2, "0");
}

function setTimerDuration() {
    const h = duration.hours.value * 60 * 60 * 1000;
    const m = duration.minutes.value * 60 * 1000;
    const s = duration.seconds.value * 1000;

    timer.duration.value = h + m + s;

    isSettingDuration.value = false;
    duration.hours.value = 0;
    duration.minutes.value = 0;
    duration.seconds.value = 0;
}

function startSettingDuration() {
    timer.reset();
    isSettingDuration.value = true;
}
</script>

<template>
    <div>
        <div v-if="isSettingDuration">
            <select v-model="duration.hours.value">
                <option v-for="it in 24" :value="it - 1" :key="it">{{ padZero(it - 1) }}</option>
            </select>

            <select v-model="duration.minutes.value">
                <option v-for="it in 60" :value="it - 1" :key="it">{{ padZero(it - 1) }}</option>
            </select>

            <select v-model="duration.seconds.value">
                <option v-for="it in 60" :value="it - 1" :key="it">{{ padZero(it - 1) }}</option>
            </select>

            <button @click="setTimerDuration">set</button>
        </div>

        <div v-else>
            <h1>{{ hhmmss(timer.duration.value - timer.elapsed.value) }}</h1>

            <button v-if="timer.state.value === TimerState.Paused" @click="timer.start">start</button>
            <button v-else @click="timer.stop">stop</button>
            <button @click="timer.reset">reset</button>
            <button @click="startSettingDuration">set duration</button>
        </div>

    </div>
    <audio ref="audioElement" src="/alarm.ogg" loop></audio>
</template>

<style scoped>
</style>
