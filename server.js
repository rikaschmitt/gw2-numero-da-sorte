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

        return res.status(500).json({
            error: error.message
        });
    }

    res.status(201).json(data);
});

// ===============================
// INICIAR SERVIDOR
// ===============================

app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
