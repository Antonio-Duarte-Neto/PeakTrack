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

    if (!treinoAtual) {
        alert("Treino não encontrado");
        return;
    }

    if (!treinoAtual.exercicios) {
        treinoAtual.exercicios = [];
    }

    renderExercises();

    screens.forEach(s => s.classList.remove("active"));

    document.getElementById("treinoAberto").classList.add("active");

    document.getElementById("screen-title").textContent =
        treinoAtual.nome;
}

function addExercise() {

    if (!treinoAtual) return;

    const nome = prompt("Nome do exercício:");

    if (!nome) return;

    treinoAtual.exercicios.push({
        id: Date.now(),
        nome: nome.trim(),
        series: []
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

function addSerie(exercicioId) {

    const exercicio = treinoAtual.exercicios.find(
        e => e.id === exercicioId
    );

    if (!exercicio) return;

    const carga = prompt("Carga (kg):");
    const reps = prompt("Repetições:");

    if (!carga || !reps) return;

    const novaSerie = {
        id: Date.now(),
        carga: parseFloat(carga),
        reps: parseInt(reps),
        concluida: false
    };

    if (!exercicio.series) {
        exercicio.series = [];
    }

    exercicio.series.push(novaSerie);

    // 🔥 ESSENCIAL: garantir sync com DB principal
    const treinoIndex = db.treinos.findIndex(
        t => t.id === treinoAtual.id
    );

    if (treinoIndex !== -1) {
        db.treinos[treinoIndex] = treinoAtual;
    }

    saveDB();
    renderExercises();
}

function deleteSerie(exercicioId, serieId) {

    const exercicio = treinoAtual.exercicios.find(
        e => e.id === exercicioId
    );

    exercicio.series = exercicio.series.filter(
        s => s.id !== serieId
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

        let seriesHTML = "";

        if (exercicio.series && exercicio.series.length > 0) {

            exercicio.series.forEach(serie => {
                seriesHTML += `
                    <div class="series-row">

                        <input type="text" disabled value="${serie.carga} kg" />
                        <input type="text" disabled value="${serie.reps} reps" />

                        <button class="btn-delete-series"
                            onclick="deleteSerie(${exercicio.id}, ${serie.id})">
                            X
                        </button>

                    </div>
                `;
            });

        } else {
            seriesHTML = `<p style="color:#666;font-size:13px;">Nenhuma série</p>`;
        }

        card.innerHTML = `
            <div class="workout-header">

                <div class="workout-title">
                    ${exercicio.nome}
                </div>

                <div class="workout-actions">

                    <button class="btn-action"
                        onclick="addSerie(${exercicio.id})">
                        + Série
                    </button>

                    <button class="btn-action"
                        onclick="deleteExercise(${exercicio.id})">
                        Excluir
                    </button>

                </div>

            </div>

         <div class="series-table">

    ${exercicio.series.map(serie => `
        
        <div class="series-row">

            <input type="text" disabled value="${serie.carga} kg" />
            <input type="text" disabled value="${serie.reps} reps" />

            <button class="btn-delete-series"
                onclick="deleteSerie(${exercicio.id}, ${serie.id})">
                X
            </button>

        </div>

    `).join("")}

</div>
        `;

        exerciseList.appendChild(card);
    });

}



/* =====================
INICIALIZAÇÃO
===================== */

renderWorkouts();