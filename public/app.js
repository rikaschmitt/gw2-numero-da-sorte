const menuItems = document.querySelectorAll("[data-page]");
const pages = document.querySelectorAll(".page");

const pageTitles = {
    dashboard: "Dashboard",
    distribuir: "Distribuir números",
    participantes: "Participantes",
    consultar: "Consultar números",
    numeros: "Todos os números",
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
        pageTitles[nome] || "Sorteio da Guilda";
}


menuItems.forEach(item => {

    item.addEventListener("click", () => {
        abrirPagina(item.dataset.page);
    });

});

// ===============================
// PARTICIPANTES
// ===============================

const EVENTO_ID = "d497f2d4-7e8c-45bb-bd60-7f10d9dcb8f5";

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


// Carregar quando a página abrir

carregarParticipantes();

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


// Carrega participantes

carregarParticipantesDistribuicao();

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
