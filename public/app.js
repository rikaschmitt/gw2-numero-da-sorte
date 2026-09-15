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

function formatarStatusEvento(status) {
    const mapa = { ativo: "Ativo", encerrado: "Encerrado", sorteado: "Sorteado" };
    return mapa[status] || status;
}

function mostrarEventoNoTopo(nome, status = "ativo") {
    [document.getElementById("event-name"), document.getElementById("dashboard-event-name")]
        .forEach(elemento => {
            if (elemento) elemento.textContent = nome;
        });

    const statusTexto = document.getElementById("event-status-text");
    if (statusTexto) {
        statusTexto.textContent = status === "ativo" ? "Evento ativo" : formatarStatusEvento(status);
    }
}

async function carregarEventos() {
    if (!listaEventos) return;

    try {
        const response = await fetch("/api/eventos");
        const eventos = await response.json();
        if (!response.ok) throw new Error(eventos.error || "Erro ao carregar eventos.");

        listaEventos.innerHTML = eventos.length
            ? eventos.map(evento => `
                <tr>
                    <td><strong>${evento.nome}</strong></td>
                    <td><span class="event-status-badge status-${evento.status}">${formatarStatusEvento(evento.status)}</span></td>
                </tr>
            `).join("")
            : `<tr><td colspan="2" class="loading">Nenhum evento cadastrado.</td></tr>`;

        if (EVENTO_ID) {
            const atual = eventos.find(evento => evento.id === EVENTO_ID);
            if (atual) atualizarCardEventoAtual(atual.nome, atual.status);
        } else if (eventoAtualNome) {
            eventoAtualNome.textContent = "Nenhum evento ativo";
            eventoAtualStatus.textContent = "Crie um novo evento para continuar.";
            btnEncerrarEvento.style.display = "none";
        }
    } catch (error) {
        console.error(error);
        listaEventos.innerHTML = `<tr><td colspan="2" class="loading">Erro ao carregar eventos.</td></tr>`;
    }
}

function atualizarCardEventoAtual(nome, status) {
    if (eventoAtualNome) eventoAtualNome.textContent = nome;
    if (eventoAtualStatus) {
        eventoAtualStatus.textContent = status === "ativo"
            ? "Este é o evento atualmente em andamento."
            : `Status: ${formatarStatusEvento(status)}`;
    }
    if (btnEncerrarEvento) {
        btnEncerrarEvento.style.display = status === "ativo" ? "inline-block" : "none";
    }
}

if (btnNovoEvento) {
    btnNovoEvento.addEventListener("click", () => {
        formEvento.style.display = "block";
        nomeEventoInput.value = "";
        mensagemEvento.textContent = "";
        nomeEventoInput.focus();
    });
}

if (btnCancelarEvento) {
    btnCancelarEvento.addEventListener("click", () => {
        formEvento.style.display = "none";
        nomeEventoInput.value = "";
        mensagemEvento.textContent = "";
    });
}

if (btnSalvarEvento) {
    btnSalvarEvento.addEventListener("click", async () => {
        const nome = nomeEventoInput.value.trim();
        mensagemEvento.textContent = "";

        if (!nome) {
            mensagemEvento.textContent = "Informe o nome do evento.";
            return;
        }

        btnSalvarEvento.disabled = true;
        btnSalvarEvento.textContent = "Criando...";

        try {
            const response = await fetch("/api/eventos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Não foi possível criar o evento.");

            formEvento.style.display = "none";
            await carregarEventoAtivo();
            await carregarEventos();
            if (EVENTO_ID) {
                await carregarParticipantes();
                await carregarParticipantesDistribuicao();
                await carregarDashboard();
            }
        } catch (error) {
            mensagemEvento.textContent = error.message;
        } finally {
            btnSalvarEvento.disabled = false;
            btnSalvarEvento.textContent = "Criar evento";
        }
    });
}

if (btnEncerrarEvento) {
    btnEncerrarEvento.addEventListener("click", async () => {
        if (!EVENTO_ID) return;
        if (!confirm("Tem certeza que deseja encerrar o evento atual?\n\nDepois disso, será possível criar um novo evento.")) return;

        btnEncerrarEvento.disabled = true;

        try {
            const response = await fetch(`/api/eventos/${EVENTO_ID}/encerrar`, { method: "POST" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Não foi possível encerrar o evento.");

            EVENTO_ID = null;
            mostrarEventoNoTopo("Nenhum evento ativo", "encerrado");
            atualizarCardEventoAtual("Nenhum evento ativo", "encerrado");
            await carregarEventos();
        } catch (error) {
            alert(error.message);
        } finally {
            btnEncerrarEvento.disabled = false;
        }
    });
}

async function carregarEventoAtivo() {
    try {
        const response = await fetch("/api/evento-ativo");
        const data = await response.json();

        if (!response.ok) {
            EVENTO_ID = null;
            mostrarEventoNoTopo("Nenhum evento ativo", "encerrado");
            return false;
        }

        EVENTO_ID = data.id;
        mostrarEventoNoTopo(data.nome, data.status);
        atualizarCardEventoAtual(data.nome, data.status);
        return true;
    } catch (error) {
        console.error("Erro ao buscar evento ativo:", error);
        EVENTO_ID = null;
        return false;
    }
}

const btnNovoParticipante =
    document.getElementById("btn-novo-participante");

const btnCancelarParticipante =
    document.getElementById("btn-cancelar-participante");

const btnSalvarParticipante =
    document.getElementById("btn-salvar-participante");

const formParticipante =
    document.getElementById("form-participante");

const codigoParticipante =
    document.getElementById("codigo-participante");

const nomeParticipante =
    document.getElementById("nome-participante");

const listaParticipantes =
    document.getElementById("lista-participantes");

const contadorParticipantes =
    document.getElementById("contador-participantes");

const mensagemParticipante =
    document.getElementById("mensagem-participante");


// Abrir formulário

btnNovoParticipante.addEventListener("click", () => {

    formParticipante.style.display = "block";

    codigoParticipante.focus();

});


// Cancelar

btnCancelarParticipante.addEventListener("click", () => {

    formParticipante.style.display = "none";

    codigoParticipante.value = "";
    nomeParticipante.value = "";

    mensagemParticipante.textContent = "";

});


// Carregar participantes

async function carregarParticipantes() {

    listaParticipantes.innerHTML = `
        <tr>
            <td colspan="2" class="loading">
                Carregando...
            </td>
        </tr>
    `;

    try {

        const response = await fetch(
            `/api/eventos/${EVENTO_ID}/participantes`
        );

        const participantes = await response.json();

        if (!response.ok) {
            throw new Error(
                participantes.error || "Erro ao carregar participantes."
            );
        }

        contadorParticipantes.textContent =
            `${participantes.length} participante${participantes.length !== 1 ? "s" : ""}`;


        if (participantes.length === 0) {

            listaParticipantes.innerHTML = `
                <tr>
                    <td colspan="2" class="loading">
                        Nenhum participante cadastrado.
                    </td>
                </tr>
            `;

            return;
        }


        listaParticipantes.innerHTML =
            participantes.map(participante => `
                <tr>
                    <td>
                        <strong>${participante.codigo}</strong>
                    </td>

                    <td>
                        ${participante.nome}
                    </td>
                </tr>
            `).join("");


    } catch (error) {

        console.error(error);

        listaParticipantes.innerHTML = `
            <tr>
                <td colspan="2" class="loading">
                    Erro ao carregar participantes.
                </td>
            </tr>
        `;

    }

}


// Salvar participante

btnSalvarParticipante.addEventListener("click", async () => {

    const codigo = codigoParticipante.value.trim();
    const nome = nomeParticipante.value.trim();


    if (!codigo || !nome) {

        mensagemParticipante.textContent =
            "Preencha o código e o nome.";

        return;
    }


    btnSalvarParticipante.disabled = true;

    btnSalvarParticipante.textContent =
        "Salvando...";


    try {

        const response = await fetch(
            `/api/eventos/${EVENTO_ID}/participantes`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    codigo,
                    nome
                })
            }
        );


        const resultado = await response.json();


        if (!response.ok) {
            throw new Error(
                resultado.error || "Erro ao cadastrar participante."
            );
        }


        // Limpa formulário

        codigoParticipante.value = "";
        nomeParticipante.value = "";

        formParticipante.style.display = "none";

        mensagemParticipante.textContent = "";


        // Atualiza lista

        await carregarParticipantes();


    } catch (error) {

        mensagemParticipante.textContent =
            error.message;

    }


    btnSalvarParticipante.disabled = false;

    btnSalvarParticipante.textContent =
        "Salvar participante";

});


// ===============================
// DISTRIBUIÇÃO DE NÚMEROS
// ===============================

const participanteDistribuicao =
    document.getElementById("participante-distribuicao");

const motivoDistribuicao =
    document.getElementById("motivo-distribuicao");

const quantidadeDistribuicao =
    document.getElementById("quantidade-distribuicao");

const btnDistribuir =
    document.getElementById("btn-distribuir");

const mensagemDistribuicao =
    document.getElementById("mensagem-distribuicao");

const resultadoDistribuicao =
    document.getElementById("resultado-distribuicao");

const numerosGerados =
    document.getElementById("numeros-gerados");

const btnCopiarNumeros =
    document.getElementById("btn-copiar-numeros");

let numerosParaCopiar = [];


// ===============================
// CARREGAR PARTICIPANTES
// ===============================

async function carregarParticipantesDistribuicao() {

    participanteDistribuicao.innerHTML = `
        <option value="">
            Carregando participantes...
        </option>
    `;

    try {

        const response = await fetch(
            `/api/eventos/${EVENTO_ID}/participantes`
        );

        const participantes = await response.json();

        if (!response.ok) {
            throw new Error(
                participantes.error ||
                "Erro ao carregar participantes."
            );
        }


        if (participantes.length === 0) {

            participanteDistribuicao.innerHTML = `
                <option value="">
                    Nenhum participante cadastrado
                </option>
            `;

            return;
        }


        participanteDistribuicao.innerHTML = `
            <option value="">
                Selecione um participante
            </option>
        `;


        participantes.forEach(participante => {

            const option = document.createElement("option");

            option.value = participante.id;

            option.textContent =
                `${participante.codigo} — ${participante.nome}`;

            participanteDistribuicao.appendChild(option);

        });


    } catch (error) {

        console.error(error);

        participanteDistribuicao.innerHTML = `
            <option value="">
                Erro ao carregar participantes
            </option>
        `;

    }

}


// ===============================
// DISTRIBUIR
// ===============================

btnDistribuir.addEventListener("click", async () => {

    const participanteId =
        participanteDistribuicao.value;

    const motivo =
        motivoDistribuicao.value;

    const quantidade =
        Number(quantidadeDistribuicao.value);


    mensagemDistribuicao.textContent = "";


    if (!participanteId) {

        mensagemDistribuicao.textContent =
            "Selecione um participante.";

        return;
    }


    if (!quantidade || quantidade < 1) {

        mensagemDistribuicao.textContent =
            "Informe uma quantidade válida.";

        return;
    }


    btnDistribuir.disabled = true;

    btnDistribuir.textContent =
        "Gerando números...";


    resultadoDistribuicao.style.display = "none";


    try {

        const response = await fetch(
            `/api/eventos/${EVENTO_ID}/distribuir`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    participante_id:
                        participanteId,

                    motivo:
                        motivo,

                    quantidade:
                        quantidade,

                    administrador:
                        "Administrador"

                })
            }
        );


        const resultado =
            await response.json();


        if (!response.ok) {

            throw new Error(
                resultado.error ||
                "Erro ao distribuir números."
            );

        }


        // Guarda os números
        numerosParaCopiar =
            resultado.numeros;


        // Mostra os números

        numerosGerados.innerHTML =
            resultado.numeros
                .map(numero => `
                    <div class="number-ticket">
                        ${numero}
                    </div>
                `)
                .join("");


        resultadoDistribuicao.style.display =
            "block";


        mensagemDistribuicao.textContent =
            `${resultado.quantidade} número(s) distribuído(s) com sucesso.`;


    } catch (error) {

        console.error(error);

        mensagemDistribuicao.textContent =
            error.message;

    }


    btnDistribuir.disabled = false;

    btnDistribuir.textContent =
        "🎟️ Distribuir números";

});


// ===============================
// COPIAR NÚMEROS
// ===============================

btnCopiarNumeros.addEventListener("click", async () => {

    if (!numerosParaCopiar.length) {
        return;
    }


    const texto =
        numerosParaCopiar.join(", ");


    try {

        await navigator.clipboard.writeText(texto);

        btnCopiarNumeros.textContent =
            "✓ Números copiados!";

        setTimeout(() => {

            btnCopiarNumeros.textContent =
                "📋 Copiar números";

        }, 2000);


    } catch (error) {

        console.error(error);

    }

});


const btnConsultar = document.getElementById("btnConsultar");

if (btnConsultar) {
    btnConsultar.addEventListener("click", consultarNumeros);
}

async function consultarNumeros() {
    const codigoInput = document.getElementById("codigoConsulta");
    const mensagem = document.getElementById("consultaMensagem");
    const resultado = document.getElementById("consultaResultado");

    const codigo = codigoInput.value.trim();

    mensagem.textContent = "";
    resultado.style.display = "none";

    if (!codigo) {
        mensagem.textContent = "Informe o código do participante.";
        return;
    }

    btnConsultar.disabled = true;
    btnConsultar.textContent = "Consultando...";

    try {
        const response = await fetch(
            `/api/eventos/${EVENTO_ID}/consultar/${encodeURIComponent(codigo)}`
        );

        const data = await response.json();

        if (!response.ok) {
            mensagem.textContent = data.error || "Participante não encontrado.";
            return;
        }

        document.getElementById("consultaNome").textContent =
            data.participante.nome;

        document.getElementById("consultaQuantidade").textContent =
            data.quantidade;

        const lista = document.getElementById("consultaNumeros");

        lista.innerHTML = "";

        data.numeros.forEach(numero => {
            const elemento = document.createElement("span");

            elemento.className = "number-ticket";
            elemento.textContent = numero;

            lista.appendChild(elemento);
        });

        resultado.style.display = "block";

        document.getElementById("btnCopiarConsulta").onclick = async () => {
            await navigator.clipboard.writeText(data.numeros.join("\n"));

            const botao = document.getElementById("btnCopiarConsulta");
            const textoOriginal = botao.textContent;

            botao.textContent = "✓ Copiado!";

            setTimeout(() => {
                botao.textContent = textoOriginal;
            }, 1500);
        };

    } catch (error) {
        console.error(error);
        mensagem.textContent = "Erro ao consultar os números.";
    } finally {
        btnConsultar.disabled = false;
        btnConsultar.textContent = "Consultar números";
    }
}

const btnAtualizarNumeros = document.getElementById("btnAtualizarNumeros");
const btnCopiarTodos = document.getElementById("btnCopiarTodos");

if (btnAtualizarNumeros) {
    btnAtualizarNumeros.addEventListener("click", carregarTodosNumeros);
}

async function carregarTodosNumeros() {
    const lista = document.getElementById("todosNumeros");
    const contador = document.getElementById("totalNumerosTodos");

    lista.innerHTML = `
        <span class="empty-state">
            Carregando números...
        </span>
    `;

    try {
        const response = await fetch(
            `/api/eventos/${EVENTO_ID}/numeros`
        );

        const data = await response.json();

        if (!response.ok) {
            lista.innerHTML = `
                <span class="empty-state">
                    ${data.error || "Erro ao carregar os números."}
                </span>
            `;
            return;
        }

        contador.textContent = data.quantidade;

        if (data.numeros.length === 0) {
            lista.innerHTML = `
                <span class="empty-state">
                    Nenhum número foi distribuído ainda.
                </span>
            `;
            return;
        }

        lista.innerHTML = "";

        data.numeros.forEach(numero => {
            const elemento = document.createElement("span");

            elemento.className = "number-ticket";
            elemento.textContent = numero;

            lista.appendChild(elemento);
        });

        btnCopiarTodos.onclick = async () => {
            await navigator.clipboard.writeText(
                data.numeros.join("\n")
            );

            const textoOriginal = btnCopiarTodos.textContent;

            btnCopiarTodos.textContent = "✓ Copiado!";

            setTimeout(() => {
                btnCopiarTodos.textContent = textoOriginal;
            }, 1500);
        };

    } catch (error) {
        console.error(error);

        lista.innerHTML = `
            <span class="empty-state">
                Não foi possível carregar os números.
            </span>
        `;
    }
}

const btnSortear = document.getElementById("btnSortear");

if (btnSortear) {
    btnSortear.addEventListener("click", realizarSorteio);
}

async function realizarSorteio() {
    const mensagem = document.getElementById("sorteioMensagem");
    const resultado = document.getElementById("resultadoSorteio");

    mensagem.textContent = "";
    resultado.style.display = "none";

    const confirmar = confirm(
        "Tem certeza que deseja realizar o sorteio?\n\n" +
        "O sorteio é oficial e só poderá ser realizado uma vez."
    );

    if (!confirmar) {
        return;
    }

    btnSortear.disabled = true;
    btnSortear.textContent = "🎲 Sorteando...";

    try {
        const response = await fetch(
            `/api/eventos/${EVENTO_ID}/sortear`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            mensagem.textContent =
                data.error || "Não foi possível realizar o sorteio.";
            return;
        }

        document.getElementById("numeroSorteado").textContent =
            data.numero;

        document.getElementById("nomeVencedor").textContent =
            data.participante_nome;

        resultado.style.display = "block";

        btnSortear.textContent = "✓ Sorteio realizado";
        btnSortear.disabled = true;

    } catch (error) {
        console.error("Erro ao realizar sorteio:", error);

        mensagem.textContent =
            "Não foi possível conectar ao servidor.";
            
        btnSortear.disabled = false;
        btnSortear.textContent = "🎲 Sortear número";
    }
}

async function carregarDashboard() {
    try {
        const response = await fetch(
            `/api/eventos/${EVENTO_ID}/dashboard`
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Erro ao carregar dashboard:", data.error);
            return;
        }

        document.getElementById("total-numeros").textContent =
            data.total_numeros;

        document.getElementById("total-participantes").textContent =
            data.total_participantes;

        document.getElementById("total-distribuicoes").textContent =
            data.total_distribuicoes;

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
    }
}

async function inicializarSistema() {
    const sucesso = await carregarEventoAtivo();

    if (!sucesso) {
        console.warn("Não há evento ativo. Crie um evento na tela de Eventos.");
        await carregarEventos();
        return;
    }

    await carregarParticipantes();
    await carregarParticipantesDistribuicao();
    await carregarDashboard();
    await carregarEventos();
}

inicializarSistema();
