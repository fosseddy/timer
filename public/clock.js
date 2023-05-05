"use strict"

let prevTimestamp;

let frame = null;
let elapsed = 0;

function tick(timestamp) {
    if (!prevTimestamp) {
        prevTimestamp = timestamp;
    }

    elapsed += timestamp - prevTimestamp;
    prevTimestamp = timestamp;

    if (elapsed >= 1000) {
        postMessage({ type: "tick", payload: elapsed - elapsed % 1000 });
        elapsed = elapsed % 1000;
    }

    frame = requestAnimationFrame(tick);
}

addEventListener("message", event => {
    switch (event.data.type) {
    case "start":
        if (!frame) {
            frame = requestAnimationFrame(tick);
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
    default:
        console.error("Worker: unknown event type", event.data.type);
        break;
    }
});
