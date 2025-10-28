// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

// --- Utilidad para consultar Wikidata ---
async function getArtistsByCountry(wikidataId) {
  const query = `
  SELECT ?artist ?artistLabel ?appleMusicArtistID WHERE {
    VALUES ?country { wd:${wikidataId} }     # País
    VALUES ?occupation { wd:Q177220 }        # Ocupación: cantante
    ?artist wdt:P27 ?country;
            wdt:P31 wd:Q5;                   # humano
            wdt:P106 ?occupation;
            wdt:P2850 ?appleMusicArtistID.   # Apple Music ID
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en,es". }
  }
  LIMIT 200
  `;

  const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query);
  const response = await fetch(url);
  const data = await response.json();

  return data.results.bindings.map(item => ({
    artist: item.artistLabel.value,
    appleMusicId: item.appleMusicArtistID.value
  }));
}

// --- Endpoint principal ---
app.get("/music/:wikidataId", async (req, res) => {
  const { wikidataId } = req.params;
  try {
    const artists = await getArtistsByCountry(wikidataId);
    if (artists.length === 0) {
      return res.status(404).json({ message: "No se encontraron artistas para este país." });
    }

    // Mezclamos aleatoriamente los resultados
    const shuffled = artists.sort(() => Math.random() - 0.5);

    // Limitamos a unos 10 artistas para no saturar
    res.json(shuffled.slice(0, 10));
  } catch (error) {
    console.error("Error obteniendo artistas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// --- Configuración para Render ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en marcha en puerto ${PORT}`);
});
