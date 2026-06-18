const STORAGE_KEY = "peaktrack_db";

const db = JSON.parse(
    localStorage.getItem(STORAGE_KEY)
) || {
    treinos: [],
    historico: []
};

// Compatibilidade com versões antigas

if (!db.historico) {
    db.historico = [];
}

let treinoAtual = null;
let treinoEmExecucao = false;
let inicioTreino = null;
let cronometroInterval = null;
let tempoAcumulado = 0;
let treinoPausado = false;

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
    exercicios: [],
    criadoEm: new Date().toISOString()
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

    treinoAtual.exercicios.forEach(exercicio => {

        if (exercicio.expanded === undefined) {
            exercicio.expanded = false;
        }

    });

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
        expanded: false,
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

        cargaExecutada: null,
        repsExecutadas: null,

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

function startWorkout() {

    if (treinoEmExecucao) return;

    treinoEmExecucao = true;

    inicioTreino = Date.now();

    cronometroInterval =
        setInterval(updateTimer, 1000);

    renderExercises();
}

function updateTimer() {

    const elapsed =
        Math.floor(
            (Date.now() - inicioTreino) / 1000
        ) + tempoAcumulado;

    const h =
        String(Math.floor(elapsed / 3600))
            .padStart(2, "0");

    const m =
        String(Math.floor((elapsed % 3600) / 60))
            .padStart(2, "0");

    const s =
        String(elapsed % 60)
            .padStart(2, "0");

    document.getElementById("timer")
        .textContent = `${h}:${m}:${s}`;
}

function pauseWorkout() {

    if (!treinoEmExecucao) return;

    clearInterval(cronometroInterval);

    tempoAcumulado += Math.floor(
        (Date.now() - inicioTreino) / 1000
    );

    treinoPausado = true;
}

function resumeWorkout() {

    if (!treinoPausado) return;

    inicioTreino = Date.now();

    cronometroInterval =
        setInterval(updateTimer, 1000);

    treinoPausado = false;
}

function finishWorkout() {

    let todasConcluidas = true;

    let volumeTotal = 0;

    treinoAtual.exercicios.forEach(exercicio => {

        exercicio.series.forEach(serie => {

            if (!serie.concluida) {
                todasConcluidas = false;
            }

            const cargaReal =
                serie.cargaExecutada ?? serie.carga;

            const repsReal =
                serie.repsExecutadas ?? serie.reps;

            if (serie.concluida) {

                volumeTotal +=
                    cargaReal * repsReal;

            }

        });

    });

    if (!todasConcluidas) {

        alert(
            "Finalize todas as séries antes de encerrar o treino."
        );

        return;
    }

    clearInterval(cronometroInterval);

    const duracao =
        tempoAcumulado +
        Math.floor(
            (Date.now() - inicioTreino) / 1000
        );

    /* EVOLUÇÃO AUTOMÁTICA */

    treinoAtual.exercicios.forEach(exercicio => {

        exercicio.series.forEach(serie => {

            if (
                serie.cargaExecutada &&
                serie.cargaExecutada > serie.carga
            ) {

                serie.carga =
                    serie.cargaExecutada;

            }

            serie.cargaExecutada = null;
            serie.repsExecutadas = null;

            serie.concluida = false;

        });

    });

    db.historico.push({

        id: Date.now(),

        treinoId: treinoAtual.id,

        treinoNome: treinoAtual.nome,

        data: new Date().toISOString(),

        volume: volumeTotal,

        duracao: duracao

    });

    saveDB();

    treinoEmExecucao = false;
    treinoPausado = false;
    tempoAcumulado = 0;
    inicioTreino = null;

    renderExercises();

    alert(
        `Treino concluído!\n\n` +
        `Volume: ${volumeTotal} kg\n` +
        `Tempo: ${Math.floor(duracao / 60)} min`
    );

}

function toggleExercise(exercicioId) {

    const exercicio =
        treinoAtual.exercicios.find(
            e => e.id === exercicioId
        );

    if (!exercicio) return;

    exercicio.expanded =
        !exercicio.expanded;

    saveDB();

    renderExercises();
}

function toggleSerie(exercicioId, serieId) {

    const exercicio =
        treinoAtual.exercicios.find(
            e => e.id === exercicioId
        );

    if (!exercicio) return;

    const serie =
        exercicio.series.find(
            s => s.id === serieId
        );

    if (!serie) return;

    serie.concluida =
        !serie.concluida;

    saveDB();

    renderExercises();

    verificarFimTreino();
}
function verificarFimTreino() {

    let todasConcluidas = true;

    treinoAtual.exercicios.forEach(exercicio => {

        exercicio.series.forEach(serie => {

            if (!serie.concluida) {
                todasConcluidas = false;
            }

        });

    });

    if (todasConcluidas && treinoEmExecucao) {

        const finalizar = confirm(
            "Todas as séries foram concluídas.\n\nDeseja finalizar o treino?"
        );

        if (finalizar) {
            finishWorkout();
        }

    }
}

function atualizarCarga(
    exercicioId,
    serieId,
    valor
) {

    const exercicio =
        treinoAtual.exercicios.find(
            e => e.id === exercicioId
        );

    if (!exercicio) return;

    const serie =
        exercicio.series.find(
            s => s.id === serieId
        );

    if (!serie) return;

    serie.cargaExecutada =
        parseFloat(valor);

    saveDB();
}

function atualizarReps(
    exercicioId,
    serieId,
    valor
) {

    const exercicio =
        treinoAtual.exercicios.find(
            e => e.id === exercicioId
        );

    if (!exercicio) return;

    const serie =
        exercicio.series.find(
            s => s.id === serieId
        );

    if (!serie) return;

    serie.repsExecutadas =
        parseInt(valor);

    saveDB();
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

            <button
                class="btn-primary"
                onclick="addExercise()">

                + Exercício

            </button>

        </div>

        <div class="execution-bar">

            <span id="timer">
                00:00:00
            </span>

            <button
                class="btn-primary"
                onclick="startWorkout()">

                Iniciar

            </button>

            <button
                class="btn-action"
                onclick="pauseWorkout()">

                Pausar

            </button>

            <button
                class="btn-action"
                onclick="resumeWorkout()">

                Retomar

            </button>

            <button
                class="btn-primary"
                onclick="finishWorkout()">

                Finalizar

            </button>

        </div>

        <div id="exerciseList"></div>
    `;

    const exerciseList =
        document.getElementById("exerciseList");

    treinoAtual.exercicios.forEach(exercicio => {

        const card =
            document.createElement("div");

        card.className =
            "workout-card";

        card.innerHTML = `

            <div class="workout-header">

                <div
                    class="workout-title"
                    onclick="toggleExercise(${exercicio.id})"
                    style="cursor:pointer;">

                    ${exercicio.expanded ? "▼" : "►"}
                    ${exercicio.nome}

                </div>

                <div class="workout-actions">

                    <button
                        class="btn-action"
                        onclick="event.stopPropagation(); addSerie(${exercicio.id})">

                        + Série

                    </button>

                    <button
                        class="btn-action"
                        onclick="event.stopPropagation(); deleteExercise(${exercicio.id})">

                        Excluir

                    </button>

                </div>

            </div>

            ${exercicio.expanded ? `

            <div class="series-table">

                ${exercicio.series.map(serie => `

                    <div class="series-row">

                        <!-- PLANEJADO -->

                        <input
                            type="text"
                            disabled
                            value="${serie.carga} kg"
                        />

                        <input
                            type="text"
                            disabled
                            value="${serie.reps} reps"
                        />

                        <!-- EXECUTADO -->

                        <input
                            type="number"
                            placeholder="Carga feita"
                            value="${serie.cargaExecutada ?? ''}"
                            ${!treinoEmExecucao ? "disabled" : ""}
                            onchange="
                                atualizarCarga(
                                    ${exercicio.id},
                                    ${serie.id},
                                    this.value
                                )
                            "
                        >

                        <input
                            type="number"
                            placeholder="Reps feitas"
                            value="${serie.repsExecutadas ?? ''}"
                            ${!treinoEmExecucao ? "disabled" : ""}
                            onchange="
                                atualizarReps(
                                    ${exercicio.id},
                                    ${serie.id},
                                    this.value
                                )
                            "
                        >

                        <!-- CONCLUIR -->

                        <button
                            class="${serie.concluida ? 'btn-finished' : 'btn-complete'}"
                            onclick="toggleSerie(${exercicio.id}, ${serie.id})">

                            ${serie.concluida ? '✓ Concluído' : 'Concluir'}

                        </button>

                        <!-- EXCLUIR -->

                        <button
                            class="btn-delete-series"
                            onclick="deleteSerie(${exercicio.id}, ${serie.id})">

                            X

                        </button>

                    </div>

                `).join("")}

            </div>

            ` : ""}

        `;

        exerciseList.appendChild(card);

    });

}


/* =====================
INICIALIZAÇÃO
===================== */

renderWorkouts();