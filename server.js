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

        // Código duplicado
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
