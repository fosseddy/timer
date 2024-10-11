interface MessageData {
    kind: "start" | "pause" | "reset";
}

let prevTimestamp = 0;
let frame = 0;
let hasFrame = false;
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
        if (!hasFrame) {
            self.requestAnimationFrame(timestamp => {
                prevTimestamp = timestamp;
                frame = self.requestAnimationFrame(tick);
                hasFrame = true;
            });
        }
        break;
    case "pause":
        if (hasFrame) {
            self.cancelAnimationFrame(frame);
            hasFrame = false;
        }
        break;
    case "reset":
        if (hasFrame) {
            self.cancelAnimationFrame(frame);
            hasFrame = false;
        }
        elapsed = 0;
        break;
    default:
        const unhandled_message_kind: never = event.data.kind;
        console.error("Worker: unknown event", unhandled_message_kind, event.data);
        break;
    }
});

export {};
