interface MessageData {
    kind: "start"|"stop"|"reset";
};

let prevTimestamp = 0;
let frame = 0;
let frameSet = false;
let elapsed = 0;

function tick(timestamp: number): void {
    elapsed += timestamp - prevTimestamp;
    prevTimestamp = timestamp;

    if (elapsed >= 1000) {
        const exceeded = elapsed % 1000;
        self.postMessage({kind: "tick", payload: elapsed - exceeded});
        elapsed = exceeded;
    }

    frame = self.requestAnimationFrame(tick);
}

self.addEventListener("message", (event: MessageEvent<MessageData>) => {
    switch (event.data.kind) {
    case "start":
        if (!frameSet) {
            self.requestAnimationFrame((timestamp: number) => {
                prevTimestamp = timestamp;
                frame = self.requestAnimationFrame(tick);
                frameSet = true;
            });
        }
        break;
    case "stop":
        if (frameSet) {
            self.cancelAnimationFrame(frame);
            frameSet = false;
        }
        break;
    case "reset":
        if (frameSet) {
            self.cancelAnimationFrame(frame);
            frameSet = false;
        }
        elapsed = 0;
        break;
    default:
        console.error("Worker: unknown event", event.data);
        break;
    }
});
