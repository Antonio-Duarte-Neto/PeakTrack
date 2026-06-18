const STORAGE_KEY = "peaktrack_db";

const db = JSON.parse(
    localStorage.getItem(STORAGE_KEY)
) || {
    treinos: [],
    historico: []
};

function saveDB() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(db)
    );
}

const navButtons =
    document.querySelectorAll(".nav-item");

const screens =
    document.querySelectorAll(".screen");

navButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        navButtons.forEach(b =>
            b.classList.remove("active")
        );

        btn.classList.add("active");

        const target =
            btn.dataset.screen;

        screens.forEach(screen =>
            screen.classList.remove("active")
        );

        document
            .getElementById(target)
            .classList.add("active");

        document
            .getElementById("screen-title")
            .textContent =
            btn.textContent.trim();

    });

});

document
.getElementById("btnNewWorkout")
.addEventListener("click", () => {

    const nome =
        prompt("Nome do treino");

    if (!nome) return;

    db.treinos.push({
        id: Date.now(),
        nome
    });

    saveDB();

    renderWorkouts();

});

function renderWorkouts() {

    const workoutList =
        document.getElementById(
            "workoutList"
        );

    workoutList.innerHTML = "";

    db.treinos.forEach(treino => {

        const card =
            document.createElement("div");

        card.className =
            "workout-card";

        card.innerHTML = `
            <div class="workout-header">
                <div class="workout-title">
                    ${treino.nome}
                </div>
            </div>
        `;

        workoutList.appendChild(card);

    });

}

renderWorkouts();