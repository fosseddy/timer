"use strict"

let duration;
let prevTimestamp;

let frame = null;
let elapsed = 0;

function update(timestamp) {
    if (!prevTimestamp) {
        prevTimestamp = timestamp;
    }

    elapsed += timestamp - prevTimestamp;
    prevTimestamp = timestamp;

    if (elapsed > duration) elapsed = duration;

    postMessage({ type: "tick", payload: elapsed });

    if (elapsed < duration) {
        frame = requestAnimationFrame(update);
    }
}

addEventListener("message", event => {
    switch (event.data.type) {
    case "start":
        if (!frame) {
            frame = requestAnimationFrame(update);
        }
        break;
    case "stop":
        if (frame) {
            cancelAnimationFrame(frame);
            frame = null;
            prevTimestamp = null;
        }
        break;
    case "reset":
        if (frame) {
            cancelAnimationFrame(frame);
            frame = null;
        }
        prevTimestamp = null;
        elapsed = 0;
        break;
    case "set-duration":
        duration = event.data.payload;
        break;
    default:
        console.error("Worker: unknown event type", event.data.type);
        break;
    }
});
