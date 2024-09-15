interface MessageData {
    kind: "tick";
    payload: number;
};

const clock = new Worker("/worker/clock.js");

clock.addEventListener("message", (event: MessageEvent<MessageData>) => {
    if (event.data.kind !== "tick") {
        console.error("unknown worker event", event.data.kind);
        return;
    }
});
