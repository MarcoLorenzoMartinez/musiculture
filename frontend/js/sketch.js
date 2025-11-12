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

function drawIcon(symbol, x, y, baseSize, onClick) {
  const hover = dist(mouseX, mouseY, x, y) < baseSize * 0.8; // detectar hover
  let iconSize = baseSize;

  // Efecto hover (aumenta un poco)
  if (hover) {
    iconSize = lerp(iconSize, baseSize * 1.2, 0.2);
    fill("#A5D6A7"); // verde más claro
  } else {
    fill(255);
  }

  // Efecto de clic (encoge momentáneamente)
  if (mouseIsPressed && hover) {
    iconSize = baseSize * 0.85;
  }

  textAlign(CENTER, CENTER);
  textSize(iconSize);
  text(symbol, x, y);

  // Clic con cooldown
  if (mouseIsPressed && !controlCooldown && hover) {
    controlCooldown = true;
    onClick();
    setTimeout(() => (controlCooldown = false), COOLDOWN_TIME);
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
	console.log("(En una futura versión podríamos almacenar el historial y volver atrás)");
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
