const menuItems = document.querySelectorAll("[data-page]");
const pages = document.querySelectorAll(".page");

const pageTitles = {
    dashboard: "Dashboard",
    eventos: "Eventos",
    distribuir: "Distribuir números",
    participantes: "Participantes",
    consultar: "Consultar números",
    todos: "Todos os números",
    sorteio: "Realizar sorteio"
};


function abrirPagina(nome) {

    pages.forEach(page => {
        page.classList.remove("active");
    });

    menuItems.forEach(item => {
        item.classList.remove("active");
    });

    const pagina = document.getElementById(nome);

    if (pagina) {
        pagina.classList.add("active");
    }

    menuItems.forEach(item => {
        if (item.dataset.page === nome) {
            item.classList.add("active");
        }
    });

    document.getElementById("page-title").textContent =
        pageTitles[nome] || "Título genérico";

    if (nome === "todos") {
        carregarTodosNumeros();
    }

    if (nome === "dashboard" && EVENTO_ID) {
        carregarDashboard();
    }

    if (nome === "eventos") {
        carregarEventos();
    }
}


menuItems.forEach(item => {

    item.addEventListener("click", () => {
        abrirPagina(item.dataset.page);
    });

});

// ===============================
// PARTICIPANTES
// ===============================

let EVENTO_ID = null;


// ===============================
// EVENTOS
// ===============================

const btnNovoEvento = document.getElementById("btn-novo-evento");
const btnCancelarEvento = document.getElementById("btn-cancelar-evento");
const btnSalvarEvento = document.getElementById("btn-salvar-evento");
const formEvento = document.getElementById("form-evento");
const nomeEventoInput = document.getElementById("nome-evento-input");
const mensagemEvento = document.getElementById("mensagem-evento");
const listaEventos = document.getElementById("lista-eventos");
const eventoAtualNome = document.getElementById("evento-atual-nome");
const eventoAtualStatus = document.getElementById("evento-atual-status");
const btnEncerrarEvento = document.getElementById("btn-encerrar-evento");

function mostrarEventoNoTopo(nome, status = "ativo") {
    const elementosNome = [
        document.getElementById("event-name"),
        document.getElementById("dashboard-event-name")
    ];

    elementosNome.forEach(elemento => {
        if (elemento) {
            elemento.textContent = nome;
        }
    });

    const statusTexto = document.getElementById("event-status-text");

    if (statusTexto) {
        statusTexto.textContent =
            status === "ativo" ? "Evento ativo" : status;
    }
}

function formatarStatusEvento(status) {
    const mapa = {
        ativo: "Ativo",
        encerrado: "Encerrado",
        sorteado: "Sorteado"
    };

    return mapa[status] || status;
}

async function carregarEventos() {
    if (!listaEventos) {
        return;
    }

    listaEventos.innerHTML = `
        <tr>
            <td colspan="2" class="loading">
                Carregando...
            </td>
        </tr>
    `;

    try {
        const response = await fetch("/api/eventos");
        const eventos = await response.json();

        if (!response.ok) {
            throw new Error(
                eventos.error || "Erro ao carregar eventos."
            );
        }

        if (!eventos.length) {
            listaEventos.innerHTML = `
                <tr>
                    <td colspan="2" class="loading">
                        Nenhum evento cadastrado.
                    </td>
                </tr>
            `;
            return;
        }

        listaEventos.innerHTML = eventos.map(evento => `
            <tr>
                <td>
                    <strong>${evento.nome}</strong>
                </td>
                <td>
                    <span class="event-status-badge status-${evento.status}">
                        ${formatarStatusEvento(evento.status)}
                    </span>
                </td>
            </tr>
        `).join("");

    } catch (error) {
        console.error(error);

        listaEventos.innerHTML = `
            <tr>
                <td colspan="2" class="loading">
                    Erro ao carregar eventos.
                </td>
            </tr>
        `;
    }
}

function atualizarCardEventoAtual(nome, status) {
    if (!eventoAtualNome || !eventoAtualStatus) {
        return;
    }

    eventoAtualNome.textContent = nome;
    eventoAtualStatus.textContent =
        status === "ativo"
            ? "Este é o evento atualmente em andamento."
            : `Status: ${formatarStatusEvento(status)}`;

    if (btnEncerrarEvento) {
        btnEncerrarEvento.style.display =
            status === "ativo" ? "inline-block" : "none";
    }
}

async function inicializarSistema() {
    await carregarEventos();

    const sucesso = await carregarEventoAtivo();

    if (!sucesso) {
        console.warn(
            "Não há evento ativo. Crie um evento na tela de Eventos."
        );
        return;
    }

    await carregarParticipantes();
    await carregarParticipantesDistribuicao();
    await carregarDashboard();
}

inicializarSistema();
