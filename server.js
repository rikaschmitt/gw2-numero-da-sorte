const express = require("express");
const path = require("path");
const supabase = require("./supabase");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// ===============================
// TESTE DO SERVIDOR
// ===============================

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Sistema funcionando!"
    });
});

// ===============================
// LISTAR EVENTOS
// ===============================

app.get("/api/eventos", async (req, res) => {
    const { data, error } = await supabase
        .from("eventos")
        .select("id, nome, status")
        .order("nome");

    if (error) {
        console.error("Erro ao listar eventos:", error);

        return res.status(500).json({
            error: error.message
        });
    }

    res.json(data);
});

app.get("/api/eventos/:eventoId/dashboard", async (req, res) => {
    const { eventoId } = req.params;

    const { data, error } = await supabase.rpc(
        "dashboard_evento",
        {
            p_evento_id: eventoId
        }
    );

    if (error) {
        console.error("Erro ao carregar dashboard:", error);

        return res.status(500).json({
            error: error.message
        });
    }

    if (!data || data.length === 0) {
        return res.status(404).json({
            error: "Não foi possível carregar os dados do dashboard."
        });
    }

    res.json(data[0]);
});

app.get("/api/evento-ativo", async (req, res) => {
    const { data, error } = await supabase
        .from("eventos")
        .select("id, nome, status")
        .eq("status", "ativo")
        .maybeSingle();

    if (error) {
        console.error("Erro ao buscar evento ativo:", error);

        return res.status(500).json({
            error: error.message
        });
    }

    if (!data) {
        return res.status(404).json({
            error: "Nenhum evento ativo no momento."
        });
    }

    res.json(data);
});

// ===============================
// CRIAR EVENTO
// ===============================

app.post("/api/eventos", async (req, res) => {
    const { nome } = req.body;

    if (!nome || !nome.trim()) {
        return res.status(400).json({
            error: "O nome do evento é obrigatório."
        });
    }

    const { data, error } = await supabase
        .from("eventos")
        .insert({
            nome: nome.trim(),
            status: "ativo"
        })
        .select("id, nome, status")
        .single();

    if (error) {
        console.error("Erro ao criar evento:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                error: "Já existe um evento ativo. Encerre o evento atual antes de criar um novo."
            });
        }

        return res.status(500).json({
            error: error.message
        });
    }

    res.status(201).json(data);
});

app.post("/api/eventos/:eventoId/encerrar", async (req, res) => {
    const { eventoId } = req.params;

    const { data, error } = await supabase
        .from("eventos")
        .update({ status: "encerrado" })
        .eq("id", eventoId)
        .eq("status", "ativo")
        .select("id, nome, status")
        .single();

    if (error) {
        console.error("Erro ao encerrar evento:", error);

        if (error.code === "PGRST116") {
            return res.status(404).json({
                error: "Evento ativo não encontrado."
            });
        }

        return res.status(500).json({
            error: error.message
        });
    }

    res.json(data);
});

// ===============================
// LISTAR PARTICIPANTES DO EVENTO
// ===============================

app.get("/api/eventos/:eventoId/participantes", async (req, res) => {
    const { eventoId } = req.params;

    const { data, error } = await supabase
        .from("participantes")
        .select("id, codigo, nome")
        .eq("evento_id", eventoId)
        .order("codigo");

    if (error) {
        console.error("Erro ao listar participantes:", error);

        return res.status(500).json({
            error: error.message
        });
    }

    res.json(data);
});

// ===============================
// CADASTRAR PARTICIPANTE
// ===============================

app.post("/api/eventos/:eventoId/participantes", async (req, res) => {
    const { eventoId } = req.params;
    const { codigo, nome } = req.body;

    if (!codigo || !codigo.trim()) {
        return res.status(400).json({
            error: "O código do participante é obrigatório."
        });
    }

    if (!nome || !nome.trim()) {
        return res.status(400).json({
            error: "O nome do participante é obrigatório."
        });
    }

    const { data, error } = await supabase
        .from("participantes")
        .insert({
            evento_id: eventoId,
            codigo: codigo.trim(),
            nome: nome.trim()
        })
        .select("id, codigo, nome")
        .single();

    if (error) {
        console.error("Erro ao cadastrar participante:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                error: "Já existe um participante com esse código neste evento."
            });
        }

        return res.status(500).json({
            error: error.message
        });
    }

    res.status(201).json(data);
});

// ===============================
// DISTRIBUIR NÚMEROS
// ===============================

app.post("/api/eventos/:eventoId/distribuir", async (req, res) => {
    const { eventoId } = req.params;

    const {
        participante_id,
        motivo,
        quantidade,
        administrador
    } = req.body;

    if (!participante_id) {
        return res.status(400).json({
            error: "O participante é obrigatório."
        });
    }

    if (!motivo || !motivo.trim()) {
        return res.status(400).json({
            error: "O motivo é obrigatório."
        });
    }

    if (!quantidade || quantidade <= 0) {
        return res.status(400).json({
            error: "A quantidade deve ser maior que zero."
        });
    }

    const { data, error } = await supabase.rpc(
        "distribuir_numeros",
        {
            p_evento_id: eventoId,
            p_participante_id: participante_id,
            p_motivo: motivo.trim(),
            p_quantidade: quantidade,
            p_administrador: administrador || null
        }
    );

    if (error) {
        console.error("Erro ao distribuir números:", error);

        return res.status(400).json({
            error: error.message
        });
    }

    res.status(201).json({
        sucesso: true,
        quantidade: data.length,
        numeros: data.map(item => item.numero)
    });
});


app.get("/api/eventos/:eventoId/consultar/:codigo", async (req, res) => {
  const { eventoId, codigo } = req.params;

  const { data, error } = await supabase.rpc(
    "consultar_numeros_participante",
    {
      p_evento_id: eventoId,
      p_codigo: codigo.trim()
    }
  );

  if (error) {
    console.error("Erro ao consultar números:", error);
    return res.status(500).json({
      error: error.message
    });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({
      error: "Nenhum participante ou número encontrado para este código."
    });
  }

  res.json({
    participante: {
      id: data[0].participante_id,
      nome: data[0].participante_nome
    },
    quantidade: data.length,
    numeros: data.map(item => item.numero)
  });
});

app.get("/api/eventos/:eventoId/numeros", async (req, res) => {
  const { eventoId } = req.params;

  const { data, error } = await supabase.rpc(
    "listar_numeros_evento",
    {
      p_evento_id: eventoId
    }
  );

  if (error) {
    console.error("Erro ao listar números:", error);
    return res.status(500).json({
      error: error.message
    });
  }

  res.json({
    quantidade: data.length,
    numeros: data.map(item => item.numero)
  });
});


app.post("/api/eventos/:eventoId/sortear", async (req, res) => {
    const { eventoId } = req.params;

    const { data, error } = await supabase.rpc(
        "sortear_numero",
        {
            p_evento_id: eventoId
        }
    );

    if (error) {
        console.error("Erro ao realizar sorteio:", error);

        return res.status(400).json({
            error: error.message
        });
    }

    if (!data || data.length === 0) {
        return res.status(404).json({
            error: "Não foi possível realizar o sorteio."
        });
    }

    const resultado = data[0];

    res.json({
        sucesso: true,
        numero: resultado.numero_sorteado,
        participante_id: resultado.participante_id,
        participante_nome: resultado.participante_nome
    });
});

// ===============================
// INICIAR SERVIDOR
// ===============================

app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
