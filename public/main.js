"use strict"

const picker = {
    elem: document.querySelector(".picker"),
    selects: document.querySelectorAll(".picker select"),
    confirmButton: document.querySelector(".picker button"),

    getValue() {
        const h = Number(this.selects[0].value);
        const m = Number(this.selects[1].value);
        const s = Number(this.selects[2].value);

        return (h * 3600 + m * 60 + s) * 1000;
    }
};

picker.confirmButton.addEventListener("click", () => {
    const val = picker.getValue();

    clock.duration = val;
    progress.opts.duration = val

    timerValue.update(val);

    picker.elem.classList.add("hidden");
    timerValue.elem.classList.remove("hidden");
});

timerValue.elem.addEventListener("click", () => {
    reset();

    picker.elem.classList.remove("hidden");
    timerValue.elem.classList.add("hidden");
});
