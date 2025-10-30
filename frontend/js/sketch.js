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
			console.log(`🌍 ${countryName} → ${wikidataId}`);
		} else {
			console.log("No se encontró el ID de Wikidata para el país:", countryName);
		}
	});

	// Botón para activar modo de control manual
	let gestureButton = createButton("🖐 Activar control por manos");
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
	fill("#2E7D32");
	rect(0, height - playerHeight, width, playerHeight);

	if (!currentSongInfo) return;

	const yBase = height - playerHeight / 2;
	const padding = 25;

	// Portada
	if (albumArt) {
		image(albumArt, padding, height - playerHeight + 10, 80, 80);
	} else {
		fill(255, 40);
		rect(padding, height - playerHeight + 10, 80, 80, 8);
	}

	// Texto (canción + artista)
	fill(255);
	textAlign(LEFT, CENTER);
	textSize(16);
	textFont("Arial, sans-serif");
	text(currentSongInfo.track, padding + 100, yBase - 10);
	textSize(14);
	fill(230);
	text(currentSongInfo.artist, padding + 100, yBase + 12);

	// Botones
	const buttonY = yBase;
	const iconSize = 28;
	const spacing = 60;
	const centerX = width - 150;

	drawIcon("⏮️", centerX - spacing, buttonY, iconSize, () => previousSong());
	drawIcon(isPlaying ? "⏸️" : "▶️", centerX, buttonY, iconSize, () => togglePlay());
	drawIcon("⏭️", centerX + spacing, buttonY, iconSize, () => nextSong());
}

function drawIcon(symbol, x, y, size, onClick) {
	textAlign(CENTER, CENTER);
	textSize(size);
	fill(255);
	text(symbol, x, y);

	// Detección de clic manual
	if (mouseIsPressed) {
		const d = dist(mouseX, mouseY, x, y);
		if (d < size / 1.2) {
			onClick();
		}
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	const globeDiv = select("#globe-container");
	globeDiv.position(0, menuHeight);
	globeDiv.size(windowWidth, windowHeight - menuHeight - playerHeight);
	resizeGlobe(windowWidth, windowHeight - menuHeight - playerHeight);
}

// === Lógica de reproducción ===

async function loadMusicForCountry(wikidataId, countryName) {
	const response = await fetch(`https://musiculture-backend.onrender.com/music/${wikidataId}`);
	const data = await response.json();
	console.log("🎵 Datos recibidos:", data);

	if (!Array.isArray(data) || data.length === 0) {
		console.log("No hay artistas disponibles para este país");
		currentSongInfo = null;
		playlistArtists = [];
		return;
	}

	playlistArtists = data;
	nextSong(countryName);
}

async function nextSong(countryName = currentSongInfo?.country) {
	if (!playlistArtists || playlistArtists.length === 0) return;

	const randomArtist = random(playlistArtists);
	const searchUrl = `https://itunes.apple.com/lookup?id=${randomArtist.appleMusicId}&entity=song&limit=10`;

	try {
		const res = await fetch(searchUrl);
		const artistData = await res.json();
		const songs = artistData.results.filter(item => item.kind === "song");

		if (songs.length === 0) return nextSong(countryName);

		const randomSong = random(songs);

		// Limpiar audio anterior
		if (currentAudio) {
			currentAudio.stop();
			currentAudio.remove();
		}
		selectAll(".musicFrame").forEach(f => f.remove());

		// Crear nuevo audio
		currentAudio = createAudio(randomSong.previewUrl);
		currentAudio.attribute("controls", false);
		currentAudio.attribute("class", "musicFrame");
		currentAudio.style("display", "none"); // oculto
		currentAudio.parent(document.body);

		currentSongInfo = {
			artist: randomArtist.artist,
			track: randomSong.trackName,
			country: countryName
		};
		isPlaying = true;

		// Cargar imagen de portada (si existe)
		if (randomSong.artworkUrl100) {
			loadImage(randomSong.artworkUrl100, img => albumArt = img);
		} else {
			albumArt = null;
		}

		currentAudio.play();
		currentAudio.elt.addEventListener("ended", () => nextSong(countryName));
	} catch (error) {
		console.error(`Error cargando música de ${randomArtist.artist}:`, error);
		await nextSong(countryName);
	}
}

function previousSong() {
	console.log("⏮️ (En una futura versión podríamos almacenar el historial y volver atrás)");
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
