<script setup>
import * as Vue from "vue";

const t = Vue.ref(0);
const w = new Worker("/clock.js");
let ticks = 0;

w.addEventListener("message", e => {
    console.log(ticks++, e.data);
    t.value += e.data.payload;
});
w.postMessage({ type: "start" });

function hhmmss(ms) {
    const secs = ms * 0.001;
    const hms = [
        Math.floor(secs / 3600),
        Math.floor(secs % 3600 / 60),
        Math.floor(secs % 60)
    ];

    return hms.map(it => String(it).padStart(2, "0")).join(":");
}
</script>

<template>
    <div>
        <h1>{{ hhmmss(t) }}</h1>
    </div>
</template>

<style scoped>
div {
    background: gray;
}

h1 {
    color: red;
}
</style>
