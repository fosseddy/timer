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

    self.postMessage({ type: "tick", payload: elapsed });

    if (elapsed < duration) {
        frame = self.requestAnimationFrame(update);
    }
}

self.addEventListener("message", event => {
    switch (event.data.type) {
    case "start":
        if (!frame) {
            frame = self.requestAnimationFrame(update);
        }
        break;
    case "stop":
        if (frame) {
            self.cancelAnimationFrame(frame);
            frame = null;
            prevTimestamp = null;
        }
        break;
    case "reset":
        if (frame) {
            self.cancelAnimationFrame(frame);
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
