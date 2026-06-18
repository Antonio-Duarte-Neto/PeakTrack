const STORAGE_KEY = "peaktrack_db";

const db = JSON.parse(
    localStorage.getItem(STORAGE_KEY)
) || {
    treinos: []
};

let treinoAtual = null;

function saveDB() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(db)
    );
}

/* =====================
NAVEGAÇÃO
===================== */

const navButtons =
    document.querySelectorAll(".nav-item");

const screens =
    document.querySelectorAll(".screen");

navButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        navButtons.forEach(item =>
            item.classList.remove("active")
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

/* =====================
TREINOS
===================== */

document
    .getElementById("btnNewWorkout")
    .addEventListener("click", createWorkout);

function createWorkout() {

    const nome =
        prompt("Digite o nome do treino:");

    if (!nome) return;

    const treino = {
        id: Date.now(),
        nome: nome.trim(),
        exercicios: []
    };

    db.treinos.push(treino);

    saveDB();

    renderWorkouts();

}

function deleteWorkout(id) {

    const confirmar =
        confirm(
            "Deseja excluir este treino?"
        );

    if (!confirmar) return;

    db.treinos =
        db.treinos.filter(
            treino => treino.id !== id
        );

    saveDB();

    renderWorkouts();

}

function openWorkout(id) {

    treinoAtual = db.treinos.find(
        treino => treino.id === id
    );

    if (!treinoAtual.exercicios) {
        treinoAtual.exercicios = [];
    }

    renderExercises();

    // 👉 muda tela
    screens.forEach(s => s.classList.remove("active"));

    document.getElementById("treinoAberto")
        .classList.add("active");

    document.getElementById("screen-title")
        .textContent = treinoAtual.nome;
}

function addExercise() {

    if (!treinoAtual) return;

    const nome =
        prompt("Nome do exercício:");

    if (!nome) return;

    treinoAtual.exercicios.push({
        id: Date.now(),
        nome: nome.trim()
    });

    saveDB();

    renderExercises();

}

function deleteExercise(id) {

    const confirmar =
        confirm(
            "Deseja excluir este exercício?"
        );

    if (!confirmar) return;

    treinoAtual.exercicios =
        treinoAtual.exercicios.filter(
            exercicio => exercicio.id !== id
        );

    saveDB();

    renderExercises();

}

/* =====================
RENDERIZAÇÃO
===================== */

function renderWorkouts() {

    const container =
        document.getElementById(
            "workoutList"
        );

    container.innerHTML = "";

    if (db.treinos.length === 0) {

        container.innerHTML =
            "<p>Nenhum treino cadastrado.</p>";

        return;
    }

    db.treinos.forEach(treino => {

        const card =
            document.createElement("div");

        card.className =
            "workout-card";

        card.onclick = () => openWorkout(treino.id);

        card.innerHTML = `
    <div class="workout-header">

        <div class="workout-title">
            ${treino.nome}
        </div>

        <div class="workout-actions">

            <button
                class="btn-action"
                onclick="event.stopPropagation(); deleteWorkout(${treino.id})">
                Excluir
            </button>

        </div>

    </div>
`;

        container.appendChild(card);

    });

}

function renderExercises() {

    const container =
        document.getElementById("treinoAberto");

    container.innerHTML = `
        <div class="section-top">
            <h2>${treinoAtual.nome}</h2>

            <button class="btn-primary" onclick="addExercise()">
                + Exercício
            </button>
        </div>

        <div id="exerciseList"></div>
    `;

    const exerciseList =
        document.getElementById("exerciseList");

    treinoAtual.exercicios.forEach(exercicio => {

        const card = document.createElement("div");
        card.className = "workout-card";

        card.innerHTML = `
            <div class="workout-header">

                <div class="workout-title">
                    ${exercicio.nome}
                </div>

                <div class="workout-actions">

                    <button class="btn-action"
                        onclick="deleteExercise(${exercicio.id})">
                        Excluir
                    </button>

                </div>

            </div>
        `;

        exerciseList.appendChild(card);
    });
}



/* =====================
INICIALIZAÇÃO
===================== */

renderWorkouts();