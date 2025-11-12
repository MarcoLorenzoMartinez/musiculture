// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const FLAG_CACHE_PATH = path.resolve("./flagsCache.json");
const FLAG_CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 días

const app = express();
app.use(cors());

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});


// --- Utilidad para consultar Wikidata ---
async function getArtistsByCountry(wikidataId) {
	const query = `
	SELECT ?artist ?artistLabel ?appleMusicArtistID WHERE {
		VALUES ?country { wd:${wikidataId} }		 # País
		VALUES ?occupation { wd:Q177220 }				# Ocupación: cantante
		?artist wdt:P27 ?country;
						wdt:P31 wd:Q5;									 # humano
						wdt:P106 ?occupation;
						wdt:P2850 ?appleMusicArtistID.	 # Apple Music ID
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

async function getFlagsFromWikidata() {
	const query = `
	SELECT ?country ?countryLabel ?flag WHERE {
		?country wdt:P31 wd:Q6256;       # instancia de país
		         wdt:P41 ?flag.          # imagen de bandera
		SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
	}`;
	const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query);
	const res = await fetch(url);
	const data = await res.json();

	const flags = {};
	for (const item of data.results.bindings) {
		flags[item.countryLabel.value] = item.flag.value;
	}
	return flags;
}

async function loadFlagCache() {
	let cacheValid = false;
	if (fs.existsSync(FLAG_CACHE_PATH)) {
		const stats = fs.statSync(FLAG_CACHE_PATH);
		const age = Date.now() - stats.mtimeMs;
		cacheValid = age < FLAG_CACHE_TTL;
	}

	if (cacheValid) {
		console.log("✅ Usando caché de banderas local");
		return JSON.parse(fs.readFileSync(FLAG_CACHE_PATH, "utf8"));
	} else {
		console.log("🌐 Descargando banderas desde Wikidata...");
		const flags = await getFlagsFromWikidata();
		fs.writeFileSync(FLAG_CACHE_PATH, JSON.stringify(flags, null, 2));
		return flags;
	}
}

let flagCache = {};
loadFlagCache().then(f => (flagCache = f));

// Endpoint para obtener las banderas
app.get("/flags", (req, res) => {
	res.json(flagCache);
});

// --- Configuración para Render ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Servidor en marcha en puerto ${PORT}`);
});
