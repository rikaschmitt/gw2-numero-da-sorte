const express = require("express");
const path = require("path");
const supabase = require("./supabase");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// Teste do servidor
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Sistema funcionando!"
    });
});

// Teste da conexão com o Supabase
app.get("/api/eventos", async (req, res) => {
    const { data, error } = await supabase
        .from("eventos")
        .select("id, nome, status")
        .order("nome");

    if (error) {
        console.error("Erro Supabase:", error);

        return res.status(500).json({
            error: error.message
        });
    }

    res.json(data);
});

app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
