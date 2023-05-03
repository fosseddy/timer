const duration = 3 * 1000;
let elapsed = 0;

let prevTimestamp = null;

function update(timestamp) {
    if (!prevTimestamp) {
        prevTimestamp = timestamp;
    }

    const dt = timestamp - prevTimestamp;
    prevTimestamp = timestamp;

    elapsed += dt;

    const a = Math.max(duration - elapsed, 0) * 0.001;
    const [h, m, s] = parseTime(a);

    let value = "";

    if (h > 0) {
        value += `${h}h `;
    }

    if (m > 0) {
        value += `${m}m `;
    }

    value += `${s}s`;

    self.postMessage({ type: "change-value", payload: value });

    if (elapsed > duration) {
        self.postMessage({ type: "play-alarm" });
        return;
    }

    self.requestAnimationFrame(update);
}

function parseTime(secs) {
    return [
        Math.floor(secs / 3600),
        Math.floor(secs / 60),
        Math.floor(secs % 60)
    ];
}

self.addEventListener("message", event => {
    switch (event.data.type) {
        case "start":
            self.requestAnimationFrame(update);
            break;
        default:
            console.log("Worker: unknown event type", event.data.type);
            break;
    }
});
