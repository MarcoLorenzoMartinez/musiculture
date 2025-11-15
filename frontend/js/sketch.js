/* sketch.js (p5.js)
	 Interfaz visual de MUSICULTURE:
	 barra verde superior con logo, globo D3 y barra inferior tipo reproductor.
*/

let menuHeight = 70; // Altura de la barra superior
let playerHeight = 100; // Altura de la barra inferior
let logoImg;
let currentAudio = null;
let currentSongInfo = null;
let playlistArtists = [];
let isPlaying = false;
let albumArt = null; // Imagen de portada actual
let controlCooldown = false;
let currentFlagISO = null;
let flagImg = null;
const COOLDOWN_TIME = 200; // tiempo en ms (0.2s)

function preload() {
	logoImg = loadImage("frontend/assets/completo_sinFondo.png");
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	noStroke();

	// Crear contenedor para el globo entre las dos barras
	const globeDiv = select("#globe-container");
	globeDiv.position(0, menuHeight);
	globeDiv.size(windowWidth, windowHeight - menuHeight - playerHeight);

	// Inicializar globo D3
	initGlobe(async (countryName) => {
		const wikidataId = await getWikidataId(countryName);
		if (wikidataId) {
			loadMusicForCountry(wikidataId, countryName);
		} else {
			console.log("No se encontró el ID de Wikidata para el país:", countryName);
		}
	});

	// Botón para activar modo de control manual
	let gestureButton = createButton("Activar control por manos");
	gestureButton.position(20, menuHeight + 10);
	gestureButton.mousePressed(() => {
		handControlActive = !handControlActive;
		if (handControlActive) {
			setupHandControl();
			autoRotate = false; // Detener rotación al activar
		} else {
			autoRotate = true;  // Reanudar rotación al desactivar
			removeCenterMarker(); // Quitar marcador central
		}
		gestureButton.html(handControlActive ? "🚫 Desactivar control por manos" : "🖐 Activar control por manos");
	});
}

function draw() {
	background(20);

	// Barra superior
	fill("#2E7D32");
	rect(0, 0, width, menuHeight);

	fill(255, 150);
	const padding = 10;
	const logoHeight = menuHeight - padding * 2;
	const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
	const x = 25;
	const y = padding;

	rect(x - 5, y - 5, logoWidth + 10, logoHeight + 10, 8);
	image(logoImg, x, y, logoWidth, logoHeight);

	// Barra inferior (reproductor)
	drawPlayerBar();

	// Control por gestos de la mano
	drawHandControl();
}

function drawPlayerBar() {
	fill("#2E7D32"); // Verde original
	rect(0, height - playerHeight, width, playerHeight);

	if (!currentSongInfo) return;

	const centerY = height - playerHeight / 2;
	const centerX = width / 2;

	// Botones principales
	const iconSize = 28;
	const spacing = 70;

	drawIcon("⏮", centerX - spacing, centerY - 5, iconSize, () => previousSong());
	drawIcon(isPlaying ? "⏸" : "▶", centerX, centerY - 5, iconSize + 4, () => togglePlay());
	drawIcon("⏭", centerX + spacing, centerY - 5, iconSize, () => nextSong());

	// Barra de progreso interactiva
	if (currentAudio && currentAudio.elt.duration) {
		const progressWidth = width * 0.45; // Más corta
		const barX = width / 2 - progressWidth / 2;
		const barY = height - 28;
		const barHeight = 6;

		const duration = currentAudio.elt.duration;
		const currentTime = currentAudio.elt.currentTime;
		const progress = map(currentTime, 0, duration, 0, progressWidth);

		// Fondo
		fill(255, 40);
		rect(barX, barY, progressWidth, barHeight, 3);

		// Progreso verde claro
		fill("#A5D6A7");
		rect(barX, barY, progress, barHeight, 3);

		// Detectar clic en la barra
		if (mouseIsPressed && mouseY > barY - 5 && mouseY < barY + barHeight + 5 &&
				mouseX > barX && mouseX < barX + progressWidth) {
			const clickPos = constrain(mouseX - barX, 0, progressWidth);
			const newTime = map(clickPos, 0, progressWidth, 0, duration);
			currentAudio.elt.currentTime = newTime;
		}

		// Tiempos (inicio / fin)
		fill(255);
		textSize(12);
		textAlign(LEFT, CENTER);
		text(formatTime(currentTime), barX - 35, barY + barHeight / 2);
		textAlign(RIGHT, CENTER);
		text(formatTime(duration), barX + progressWidth + 35, barY + barHeight / 2);
	}

	// Info canción
	const padding = 25;
	if (albumArt) {
		image(albumArt, padding, height - playerHeight + 10, 80, 80);
	}

	// Bandera del país (si existe)
	if (albumArt && flagImg) {
		// Tamaño de la bandera
		const flagW = 26;
		const flagH = 18;

		// Coordenadas de la portada
		const artX = padding;
		const artY = height - playerHeight + 10;
		const artW = 80;
		const artH = 80;

		// Posición de la bandera (esquina inferior derecha de la portada)
		const flagX = artX + artW - flagW + 10;
		const flagY = artY + artH - flagH + 6;

		image(flagImg, flagX, flagY, flagW, flagH);
	}

	fill(255);
	textAlign(LEFT, CENTER);
	textSize(18);
	textStyle(BOLD);
	text(currentSongInfo.track, padding + 100, centerY - 10);
	textSize(14);
	textStyle(NORMAL);
	fill(230);
	text(currentSongInfo.artist, padding + 100, centerY + 14);
}

function drawIcon(symbol, x, y, size, onClick) {
	textAlign(CENTER, CENTER);
	textSize(size);
	fill(255);
	text(symbol, x, y);

	// Detección de clic con cooldown
	if (mouseIsPressed && !controlCooldown) {
		const d = dist(mouseX, mouseY, x, y);
		if (d < size) {
			controlCooldown = true;
			onClick();
			setTimeout(() => (controlCooldown = false), COOLDOWN_TIME);
		}
	}
}

function formatTime(seconds) {
	if (isNaN(seconds)) return "0:00";
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	const globeDiv = select("#globe-container");
	globeDiv.position(0, menuHeight);
	globeDiv.size(windowWidth, windowHeight - menuHeight - playerHeight);
	resizeGlobe(windowWidth, windowHeight - menuHeight - playerHeight);
}




// ---------Lógica de reproducción---------

let playlist = [];
let currentIndex = 0;

// Motor de precarga optimizada
let isFetching = false;
let pendingFetch = false;

const INITIAL_BATCH = 2;  // primeras canciones al cambiar de país
const FETCH_BATCH = 5;    // cada recarga en background
const MIN_LEFT = 4;        // cuando queden 4 -> recargar

// Cargar música para un país dado su ID de Wikidata
async function loadMusicForCountry(wikidataId, countryName) {
	const response = await fetch(`https://musiculture-backend.onrender.com/music/${wikidataId}`);
	const data = await response.json();

	if (!Array.isArray(data) || data.length === 0) {
		console.warn("No hay artistas disponibles para este país");
		currentSongInfo = null;
		playlist = [];
		return;
	}

	playlistArtists = data;
	currentIndex = 0;
	playlist = [];

	// Precargar canciones iniciales rápido
	await fetchMoreSongs(countryName, INITIAL_BATCH);

	// Obtener la bandera
	currentFlagISO = await getCountryFlag(countryName);
	flagImg = null;
	if (currentFlagISO) {
		const flagUrl = `https://flagcdn.com/w80/${currentFlagISO}.png`;
		loadImage(flagUrl, img => flagImg = img);
	}

	playCurrentSong();
}

// Convertir el nombre de un país en ISO2 usando un endpoint CDN gratuito
async function getCountryFlag(countryName) {
	const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fields=cca2`;
	try {
		const res = await fetch(url);
		const data = await res.json();
		if (data && data[0] && data[0].cca2) {
			return data[0].cca2.toLowerCase();
		}
	} catch (err) {
		console.warn("No se pudo obtener ISO2 de", countryName);
	}
	return null;
}

async function fetchMoreSongs(countryName, batchSize = FETCH_BATCH) {
	if (isFetching) {
		pendingFetch = true;
		return;
	}

	isFetching = true;

	try {
		const newSongs = [];

		// Seguimos hasta llenar el batch
		while (newSongs.length < batchSize && playlistArtists.length > 0) {
			const randomArtist = random(playlistArtists);
			const searchUrl = `https://itunes.apple.com/lookup?id=${randomArtist.appleMusicId}&entity=song&limit=10`;

			try {
				const res = await fetch(searchUrl);
				const artistData = await res.json();
				const songs = artistData.results.filter(item => item.kind === "song");
				if (songs.length === 0) continue;

				const randomSong = random(songs);

				newSongs.push({
					artist: randomArtist.artist,
					track: randomSong.trackName,
					country: countryName,
					previewUrl: randomSong.previewUrl,
					artwork: randomSong.artworkUrl100 || null,
					id: randomSong.trackId // sirve para evitar duplicados futuros
				});
			} catch (err) {
				console.warn("Error precargando artista:", err);
			}
		}

		// Evitar duplicados
		const existingIDs = new Set(playlist.map(s => s.id));
		const filtered = newSongs.filter(s => !existingIDs.has(s.id));

		playlist.push(...filtered);
	} finally {
		isFetching = false;

		// Si mientras se hacía fetch, el usuario pasó rápido, volver a cargar
		if (pendingFetch) {
			pendingFetch = false;
			await fetchMoreSongs(countryName, batchSize);
		}
	}
}

// Reproducir la canción actual en el índice
function playCurrentSong() {
	if (playlist.length === 0) return;

	const song = playlist[currentIndex];

	if (currentAudio) {
		currentAudio.stop();
		currentAudio.remove();
	}

	selectAll(".musicFrame").forEach(f => f.remove());

	currentAudio = createAudio(song.previewUrl);
	currentAudio.attribute("controls", false);
	currentAudio.attribute("class", "musicFrame");
	currentAudio.style("display", "none");
	currentAudio.parent(document.body);

	currentSongInfo = {
		artist: song.artist,
		track: song.track,
		country: song.country
	};
	isPlaying = true;

	if (song.artwork) {
		loadImage(song.artwork, img => albumArt = img);
	} else {
		albumArt = null;
	}

	currentAudio.play();
	currentAudio.elt.addEventListener("ended", () => nextSong());
}

// Reproducir siguiente canción
async function nextSong() {
	if (playlist.length === 0) return;

	currentIndex++;

	// Si llegamos al final y no hay todavía nuevas canciones,
	// pedimos inmediatamente (sin bloquear)
	if (currentIndex >= playlist.length) {
		await fetchMoreSongs(currentSongInfo.country);
		currentIndex = playlist.length - 1;
	}

	playCurrentSong();

	// Precarga automática cuando queden pocas
	const remaining = playlist.length - currentIndex;
	if (remaining <= MIN_LEFT) {
		fetchMoreSongs(currentSongInfo.country); // sin await, no bloquea
	}
}

// Reproducir canción anterior
function previousSong() {
	if (currentIndex > 0) {
		currentIndex--;
		playCurrentSong();
	}
}

// Alternar reproducción/pausa
function togglePlay() {
	if (!currentAudio) return;
	if (isPlaying) {
		currentAudio.pause();
		isPlaying = false;
	} else {
		currentAudio.play();
		isPlaying = true;
	}
}
