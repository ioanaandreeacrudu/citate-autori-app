const express = require("express");
const cors = require("cors");
const Joi = require("joi");
const fs = require("fs"); 
const path = require("path"); 

const app = express(); // DEFINIREA 'app' TREBUIE SĂ FIE AICI SUS

app.use(cors());
app.use(express.json());

const JSON_SERVER_URL = "http://localhost:3000/quotes";

// Directorul unde salvăm imaginile descărcate
const IMAGES_DIR = path.join(__dirname, "images");

// Creăm directorul /images dacă nu există deja 
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Expunem folderul de imagini ca fiind static 
app.use("/images", express.static(IMAGES_DIR));

// Verificăm dacă id-ul din PUT și DELETE este un număr valid
const validateId = (req, res, next) => {
    if (isNaN(req.params.id)) {
        return res.status(400).json({ error: "Invalid ID format" });
    }
    next();
};

// Schema Joi actualizată (include imageUrl) 
const quoteSchema = Joi.object({
    author: Joi.string().min(2).max(100).required(),
    quote: Joi.string().min(5).max(500).required(),
    imageUrl: Joi.string().allow("").optional(),
});

// --- RUTE ---

// 1. POST /api/quotes/fetch-image (Trebuie să fie ÎNAINTE de rutele cu :id) 
app.post("/api/quotes/fetch-image", async (req, res) => {
    const { author } = req.body;
    if (!author || !author.trim()) {
        return res.status(400).json({ error: "Numele autorului este obligatoriu." });
    }

    try {
        const wikiName = author.trim().replace(/\s+/g, "_"); // [cite: 731]
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiName)}`; // 

        const wikiResponse = await fetch(wikiUrl, {
            headers: { "User-Agent": "PrintingQuotesApp/1.0" } // 
        });

        if (!wikiResponse.ok) {
            return res.status(404).json({ error: `Autorul "${author}" nu a fost găsit pe Wikipedia.` });
        }

        const wikiData = await wikiResponse.json();
        if (!wikiData.thumbnail?.source) {
            return res.status(404).json({ error: `Nu există imagine disponibilă pentru "${author}" pe Wikipedia.` });
        }

        const imageUrl = wikiData.thumbnail.source;
        const ext = imageUrl.split(".").pop().split("?")[0].toLowerCase(); // 
        const fileName = `${author.trim().toLowerCase().replace(/\s+/g, "_")}.${ext}`; // 
        const filePath = path.join(IMAGES_DIR, fileName);

        if (fs.existsSync(filePath)) {
            return res.status(200).json({ imageUrl: `/images/${fileName}` }); // 
        }

        const imgResponse = await fetch(imageUrl);
        if (!imgResponse.ok) throw new Error("Nu s-a putut descărca imaginea.");

        const buffer = Buffer.from(await imgResponse.arrayBuffer()); //
        fs.writeFileSync(filePath, buffer); // [cite: 783]

        res.status(200).json({ imageUrl: `/images/${fileName}` });
    } catch (error) {
        console.error("Eroare la fetch-image:", error.message);
        res.status(500).json({ error: "Eroare internă la preluarea imaginii." });
    }
});

// 2. GET /api/quotes (cu filtrare)
app.get("/api/quotes", async (req, res) => {
    try {
        const response = await fetch(JSON_SERVER_URL);
        const data = await response.json();
        const { search } = req.query;
        if (search && search.trim()) {
            const term = search.trim().toLowerCase();
            const filtered = data.filter(q =>
                q.author.toLowerCase().includes(term) ||
                q.quote.toLowerCase().includes(term)
            );
            return res.status(200).json(filtered);
        }
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Nu s-au putut prelua citatele." });
    }
});

// 3. POST /api/quotes
app.post("/api/quotes", async (req, res) => {
    const { error } = quoteSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    try {
        const response = await fetch(JSON_SERVER_URL);
        const quotes = await response.json();
        const newId = quotes.length > 0 ? Math.max(...quotes.map(q => Number(q.id))) + 1 : 1;
        const newQuote = { id: newId.toString(), ...req.body };

        const postResponse = await fetch(JSON_SERVER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newQuote),
        });
        res.status(postResponse.status).json(await postResponse.json());
    } catch (error) {
        res.status(500).json({ error: "Failed to add quote" });
    }
});

// 4. PUT /api/quotes/:id
app.put("/api/quotes/:id", validateId, async (req, res) => {
    const { error } = quoteSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    try {
        const quoteId = req.params.id;
        const response = await fetch(`${JSON_SERVER_URL}/${quoteId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: quoteId, ...req.body }),
        });
        if (!response.ok) return res.status(404).json({ error: "Quote not found" });
        res.status(200).json(await response.json());
    } catch (error) {
        res.status(500).json({ error: "Failed to update quote" });
    }
});

// 5. DELETE /api/quotes/:id
app.delete("/api/quotes/:id", validateId, async (req, res) => {
    try {
        const quoteId = req.params.id;
        const response = await fetch(`${JSON_SERVER_URL}/${quoteId}`, { method: "DELETE" });
        if (!response.ok) return res.status(404).json({ error: "Quote not found" });
        res.status(200).json({ message: "Quote deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete quote" });
    }
});

const port = 5000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});