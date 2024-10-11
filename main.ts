interface MessageData {
    kind: "tick";
    payload: number;
}

const enum TimerState {
    PAUSED,
    STARTED,
    FINISHED
}

interface Timer {
    state: TimerState;
    clock: Worker;
    alarm: HTMLAudioElement;
    progress: Animation;
    initialValue: number;
    value: number;
}

function timerStart(timer: Timer): void {
    timer.clock.postMessage({kind: "start"});
    timer.state = TimerState.STARTED;
    timer.progress.play();
}

function timerPause(timer: Timer): void {
    timer.clock.postMessage({kind: "pause"});
    timer.state = TimerState.PAUSED;
    timer.progress.pause();
}

function timerFinish(timer: Timer): void {
    timer.clock.postMessage({kind: "reset"});
    timer.state = TimerState.FINISHED;
    timer.progress.pause();
    timer.alarm.play();
}

function timerReset(timer: Timer): void {
    timer.clock.postMessage({kind: "reset"});
    timer.state = TimerState.PAUSED;
    timer.value = timer.initialValue;
    timer.progress.cancel()
    timerStopAlarm(timer);
}

function timerStopAlarm(timer: Timer): void {
    if (!timer.alarm.paused) {
        timer.alarm.pause();
        timer.alarm.currentTime = 0;
    }
}

function loadAlarm(): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
        const a = new Audio("/alarm.ogg");
        a.loop = true;
        a.addEventListener("canplaythrough", () => resolve(a));
        a.addEventListener("error", reject);
    });
}

function createProgressAnimation(element: HTMLElement, duration: number): Animation {
    const anim = element.animate([{width: "100%"}], {
        duration: duration,
        fill: "forwards",
        easing: "linear"
    });

    anim.cancel();

    return anim;
}

function hhmmss(ms: number): string {
    let s = ms / 1000;
    let hms = [0, 0, 0];

    hms[0] = Math.floor(s / 3600);
    hms[1] = Math.floor(s % 3600 / 60);
    hms[2] = Math.floor(s % 3600 % 60);

    return hms.map(v => String(v).padStart(2, "0")).join(":");
}

const timerHTML = {
    value: document.querySelector(".timer__value")! as HTMLDivElement,
    progress: document.querySelector(".progress__bar--done")! as HTMLDivElement,
    toggle: document.querySelector("#toggle")! as HTMLButtonElement,
    reset: document.querySelector("#reset")! as HTMLButtonElement,
}

const alarm = await loadAlarm();
const clock = new Worker("/worker/clock.js", {type: "module"});
const initval = 45 * 60 * 1000;

const timer: Timer = {
    clock,
    alarm,
    progress: createProgressAnimation(timerHTML.progress, initval),
    state: TimerState.PAUSED,
    initialValue: initval,
    value: initval
};

timerHTML.value.textContent = hhmmss(timer.value);

timer.clock.addEventListener("message", (event: MessageEvent<MessageData>) => {
    switch (event.data.kind) {
    case "tick":
        timer.value -= event.data.payload;
        if (timer.value < 0) {
            timer.value = 0;
        }

        timerHTML.value.textContent = hhmmss(timer.value);

        if (timer.value === 0) {
            timerFinish(timer);
            timerHTML.toggle.textContent = "stop";
        }
        break;
    default:
        const unhandled_message_kind: never = event.data.kind;
        console.error("Worker: unknown event", unhandled_message_kind, event.data);
        break;
    }
});

timerHTML.toggle.addEventListener("click", () =>{
    switch (timer.state) {
    case TimerState.STARTED:
        timerPause(timer);
        timerHTML.toggle.textContent = "start";
        break;
    case TimerState.PAUSED:
        timerStart(timer);
        timerHTML.toggle.textContent = "pause";
        break;
    case TimerState.FINISHED:
        timerStopAlarm(timer);
        break;
    default:
        const unhandled_timer_state: never = timer.state;
        console.log(unhandled_timer_state);
    }
});

timerHTML.reset.addEventListener("click", () => {
    timerReset(timer);
    timerHTML.value.textContent = hhmmss(timer.value);
    timerHTML.toggle.textContent = "start";
});

const form = document.querySelector(".duration")! as HTMLFormElement;
form.addEventListener("submit", e => {
    e.preventDefault();
    form.duration.classList.remove("duration__input--error");

    const input = form.duration.value.trim();

    if (!input) {
        return;
    }

    let duration = 0;
    let digitbuf = "";
    let error = false;

    for (let i = 0; i < input.length; ++i) {
        const ch = input[i];

        if (ch >= "0" && ch <= "9") {
            digitbuf += ch;
            continue;
        }

        if (!"hms".includes(ch)) {
            error = true;
            break;
        }

        if (!digitbuf) {
            error = true;
            break;
        }

        let val = Number(digitbuf);
        if (ch === "h") {
            val *= 3600;
        } else if (ch === "m") {
            val *=  60;
        }

        duration += val;
        digitbuf = "";
    }

    if (digitbuf) {
        error = true;
    }

    if (error) {
        form.duration.classList.add("duration__input--error");
        return;
    }

    const maxDuration = 99 * 3600 + 59 * 60 + 59;
    if (duration > maxDuration) {
        duration = maxDuration;
    }

    duration *= 1000;

    timerReset(timer);

    timer.value = timer.initialValue = duration;
    timer.progress = createProgressAnimation(timerHTML.progress, duration);

    timerHTML.toggle.textContent = "start";
    timerHTML.value.textContent = hhmmss(duration);

    form.reset();
    timerHTML.toggle.focus();
});

export {};
