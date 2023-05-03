const value = document.querySelector("#value");
const button = document.querySelector("button");

const alarm = new Audio("/alarm.ogg");
alarm.loop = true;

const timer = new Worker("/timer.js");

timer.addEventListener("message", event => {
    switch (event.data.type) {
        case "change-value":
            value.textContent = event.data.payload;
            break;
        case "play-alarm":
            alarm.play();
            break;
        default:
            console.log("Main: unknown event type", event.data.type);
            break;
    }
});

button.addEventListener("click", () => {
    timer.postMessage({ type: "start" });
});
