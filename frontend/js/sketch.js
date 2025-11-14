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
			console.log(`🌍 ${countryName} -> ${wikidataId}`);
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

	// === Barra superior ===
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

	// === Información actual (en barra superior) ===
	if (currentSongInfo) {
		fill(255);
		textSize(16);
		textAlign(LEFT, CENTER);
		textFont("Arial, sans-serif");
		textStyle(BOLD);
		text(`🌍 ${currentSongInfo.country}`, x + logoWidth + 30, menuHeight / 2 - 12);
		textStyle(NORMAL);
		text(`🎵 ${currentSongInfo.artist} — ${currentSongInfo.track}`, x + logoWidth + 30, menuHeight / 2 + 12);
	}

	// === Barra inferior (reproductor) ===
	drawPlayerBar();

	// === Control por gestos de la mano ===
	drawHandControl();
}

function drawPlayerBar() {
	fill("#2E7D32"); // Verde original
	rect(0, height - playerHeight, width, playerHeight);

	if (!currentSongInfo) return;

	const centerY = height - playerHeight / 2;
	const centerX = width / 2;

	// === Botones principales ===
	const iconSize = 28;
	const spacing = 70;

	drawIcon("⏮", centerX - spacing, centerY - 5, iconSize, () => previousSong());
	drawIcon(isPlaying ? "⏸" : "▶", centerX, centerY - 5, iconSize + 4, () => togglePlay());
	drawIcon("⏭", centerX + spacing, centerY - 5, iconSize, () => nextSong());

	// === Barra de progreso interactiva ===
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

	// === Info canción ===
	const padding = 25;
	if (albumArt) {
		image(albumArt, padding, height - playerHeight + 10, 80, 80);
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

// === Lógica de reproducción ===

let playlist = [];
let currentIndex = 0;
let loadingMore = false;

async function loadMusicForCountry(wikidataId, countryName) {
	console.log(`🎶 Cargando música para ${countryName} (${wikidataId})`);
	const response = await fetch(`https://musiculture-backend.onrender.com/music/${wikidataId}`);
	const data = await response.json();

	if (!Array.isArray(data) || data.length === 0) {
		console.warn("No hay artistas disponibles para este país");
		currentSongInfo = null;
		playlistArtists = [];
		playlist = [];
		return;
	}

	playlistArtists = data;
	for (let artist of playlistArtists) {
		console.log(`  🎤 Artista: ${artist.artist} (Apple Music ID: ${artist.appleMusicId})`)
	};
	currentIndex = 0;
	playlist = [];

	// Cargar 10 canciones iniciales
	await fetchMoreSongs(countryName);
	playCurrentSong();
}

async function fetchMoreSongs(countryName) {
	if (loadingMore) return;
	loadingMore = true;

	console.log("🎧 Precargando 10 canciones nuevas...");
	const newSongs = [];

	while (newSongs.length < 10 && playlistArtists.length > 0) {
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
				artwork: randomSong.artworkUrl100 || null
			});

			console.log(`  ➕ ${randomArtist.artist} — ${randomSong.trackName}`);
		} catch (err) {
			console.warn("Error precargando artista:", err);
		}
	}

	playlist.push(...newSongs);
	console.log(`✅ Playlist ampliada: ${playlist.length} canciones`);
	loadingMore = false;
}

function playCurrentSong() {
	if (playlist.length === 0) return;

	const song = playlist[currentIndex];
	console.log(`🎵 Reproduciendo: ${song.artist} — ${song.track}`);

	// Limpiar audio anterior
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

async function nextSong() {
	if (playlist.length === 0) return;

	currentIndex++;
	if (currentIndex >= playlist.length) {
		console.log("🎶 Fin de lista, recargando más canciones...");
		await fetchMoreSongs(currentSongInfo.country);
		currentIndex = Math.min(currentIndex, playlist.length - 1);
	}

	playCurrentSong();

	// Si quedan 2 canciones antes del final, precargar más
	if (playlist.length - currentIndex <= 2) {
		fetchMoreSongs(currentSongInfo.country);
	}
}

function previousSong() {
	if (currentIndex > 0) {
		currentIndex--;
		playCurrentSong();
	} else {
		console.log("⏮ Ya estás en la primera canción");
	}
}

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
