/* sketch.js (p5.js)
	 Interfaz visual de MUSICULTURE:
	 barra verde superior con logo, globo D3 y barra inferior tipo reproductor.
*/

let mode = "normal"; // "normal" / "favorites" / "help"
let interactionMode = "normal"; // "normal", "handControl" o "voiceControl"

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

// Favoritos
let favorites = [];
let isFavorite = false;
let favoriteArtworks = {}; // Cache de portadas de favoritos
let favoriteFlagImgs = {}; // Cache de banderas de favoritos

// Scroll de favoritos
let favoritesScrollY = 0;
let maxFavoritesScroll = 0;

function preload() {
	logoImg = loadImage("frontend/assets/completo_sinFondo.png");
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	noStroke();

	// Cargar favoritos
	loadFavorites();
	loadFavoriteImages();

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

	// // Botón para activar modo de control manual
	// let gestureButton = createButton("Activar control por manos");
	// gestureButton.position(20, menuHeight + 10);
	// gestureButton.mousePressed(() => {
	// 	handControlActive = !handControlActive;
	// 	if (handControlActive) {
	// 		setupHandControl();
	// 		autoRotate = false; // Detener rotación al activar
	// 	} else {
	// 		cleanupHandControl();
	// 	}
	// 	gestureButton.html(handControlActive ? "🚫 Desactivar control por manos" : "🖐 Activar control por manos");
	// });

	// // Botón para activar/desactivar control por voz
	// addVoiceButton();
}

// function addVoiceButton() {
// 	let voiceBtn = createButton("🎤 Activar voz");
//     voiceBtn.position(20, menuHeight + 50);

//     voiceBtn.mousePressed(() => {
//         voiceActive = !voiceActive;

//         if (voiceActive) {
//             setupVoiceControl();
//             recognition.start();
//             voiceBtn.html("🛑 Desactivar voz");
//         } else {
//             recognition.stop();
//             voiceBtn.html("🎤 Activar voz");
//         }
//     });
// }

function draw() {
	background(20);

	// Barra superior (menú)
	drawMenuBar();

	// Barra inferior (reproductor)
	drawPlayerBar();

	if (mode === "normal") {
		// Control por gestos de la mano
		drawHandControl();
	} else if (mode === "favorites") {
		drawFavoritesUI();
	} else if (mode === "help") {
		drawHelpUI();
	}
}

function drawMenuBar() {
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

	// Modos de juego
	const baseY = menuHeight / 2;
	const startX = 230;
	const spacing = 150;

	drawModeItem(
	"Normal",
	startX,
	baseY,
	interactionMode === "normal",
	() => setInteractionMode("normal")
	);

	drawSeparator(startX + spacing / 2, 15, menuHeight - 15);

	drawModeItem(
	"Control Gestual",
	startX + spacing,
	baseY,
	interactionMode === "handControl",
	() => setInteractionMode("handControl")
	);

	drawSeparator(startX + spacing * 3/2, 15, menuHeight - 15);

	drawModeItem(
	"Control por Voz",
	startX + spacing * 2,
	baseY,
	interactionMode === "voiceControl",
	() => setInteractionMode("voiceControl")
	);

	// Icono de favoritos en la barra superior
	const favIconSize = 40;
	const favX = width - 60;
	const favY = menuHeight / 2;

	drawIcon(mode === "favorites" ? "✕" : "★", favX, favY, favIconSize, () => {
		setMode("favorites");
	});

	// Icono de ayuda
	drawModeItem(
		"Help", width - 120, baseY, mode === "help",
		() => setMode("help")
	);
}

function setMode(newMode) {
	if (mode === "normal") {
		mode = newMode;
		if (mode === "favorites") {
			favoritesScrollY = 0;
		}
		// Ocultar globo
			select("#globe-container").style("display", "none");

		// Limpiar selección de país
		clearSelectedCountry();

		// Detener audio actual
		if (currentAudio) {
			currentAudio.stop();
			currentAudio.remove();
		}
		currentAudio = null;
		currentSongInfo = null;
		albumArt = null;
		flagImg = null;
		isPlaying = false;
		selectAll(".musicFrame").forEach(f => f.remove());
	} else {
		mode = "normal";
		// Mostrar globo
			select("#globe-container").style("display", "block");

			// Reset del reproductor al salir de favoritos
			if (currentAudio) {
				currentAudio.stop();
				currentAudio.remove();
			}
			currentAudio = null;
			currentSongInfo = null;
			albumArt = null;
			flagImg = null;
			isPlaying = false;
	}

}

function drawModeItem(label, x, y, active, onClick) {
  const w = textWidth(label) + 20;
  const hover = mouseX > x - w / 2 && mouseX < x + w / 2 &&
                mouseY > y - 15 && mouseY < y + 15;

  if (active) {
    fill("#A5D6A7");
  } else if (hover) {
    fill(220);
  } else {
    fill(255);
  }

  textAlign(CENTER, CENTER);
  textSize(18);
  textStyle(active ? BOLD : NORMAL);
//   textStyle(BOLD);
  text(label, x, y);

  if (mouseIsPressed && hover && !controlCooldown) {
    controlCooldown = true;
    onClick();
    setTimeout(() => controlCooldown = false, COOLDOWN_TIME);
  }
}

function drawSeparator(x, yTop, yBottom) {
  stroke(255, 120);
  strokeWeight(2);
  line(x, yTop, x, yBottom);
  noStroke();
}



function drawFavoritesUI() {
	// Área de contenido
	const contentY = menuHeight;
	const contentHeight = height - menuHeight - playerHeight;
	
	// Fondo semi-transparente
	fill(30, 30, 35);
	rect(0, contentY, width, contentHeight);

	// Título
	fill(255);
	textAlign(CENTER, TOP);
	textSize(32);
	textStyle(BOLD);
	text("Mis Favoritos", width / 2, contentY + 30);

	if (favorites.length === 0) {
		// Mensaje vacío
		fill(200);
		textSize(18);
		textStyle(NORMAL);
		text("No tienes canciones favoritas aún", width / 2, contentY + 100);
		text("¡Explora países y añade música que te guste!", width / 2, contentY + 130);
		return;
	}

	// Grid de favoritos
	const cardWidth = 280;
	const cardHeight = 100;
	const gap = 20;
	const cols = Math.floor((width - 60) / (cardWidth + gap));
	const startX = (width - (cols * (cardWidth + gap) - gap)) / 2;
	const startY = contentY + 90;

	// Calcular scroll máximo
	const rows = Math.ceil(favorites.length / cols);
	const totalHeight = rows * (cardHeight + gap);
	maxFavoritesScroll = max(0, totalHeight - contentHeight + 120);

	push();
	// Clip para que no se salga del área
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(0, startY, width, contentHeight - 90);
	drawingContext.clip();

	// Dibujar cada canción favorita
	favorites.forEach((fav, index) => {
		const col = index % cols;
		const row = Math.floor(index / cols);
		const x = startX + col * (cardWidth + gap);
		const y = startY + row * (cardHeight + gap) - favoritesScrollY;

		// Solo dibujar si está visible
		if (y + cardHeight > contentY && y < contentY + contentHeight) {
			drawFavoriteCard(fav, x, y, cardWidth, cardHeight, index);
		}
	});

	drawingContext.restore();
	pop();

	// Indicador de scroll si hay más contenido
	if (maxFavoritesScroll > 0) {
		fill(100);
		textSize(14);
		textAlign(CENTER, BOTTOM);
		text("↕ Usa la rueda del ratón para desplazarte", width / 2, height - playerHeight - 10);
	}
}

function drawFavoriteCard(fav, x, y, w, h, index) {
	// Detectar hover
	const isHover = mouseX > x && mouseX < x + w && 
	                mouseY > y && mouseY < y + h;

	// Card background
	if (isHover) {
		fill(60, 80, 60);
		stroke(140, 200, 140);
		strokeWeight(2);
	} else {
		fill(45, 50, 55);
		stroke(70, 75, 80);
		strokeWeight(1);
	}
	rect(x, y, w, h, 8);
	noStroke();

	// Portada
	const artSize = 80;
	const artX = x + 10;
	const artY = y + 10;

	if (favoriteArtworks[fav.id]) {
		image(favoriteArtworks[fav.id], artX, artY, artSize, artSize);
	} else {
		// Placeholder
		fill(80);
		rect(artX, artY, artSize, artSize, 4);
		fill(150);
		textSize(12);
		textAlign(CENTER, CENTER);
		text("♪", artX + artSize / 2, artY + artSize / 2);
	}

	// Bandera sobre la portada
	if (fav.flag && favoriteFlagImgs[fav.flag]) {
		const flagW = 24;
		const flagH = 16;
		const flagX = artX + artSize - flagW + 8;
		const flagY = artY + artSize - flagH + 6;
		image(favoriteFlagImgs[fav.flag], flagX, flagY, flagW, flagH);
	}

	// Info de la canción
	const textX = artX + artSize + 12;
	const textY = y + 15;
	const textW = w - artSize - 60;

	fill(255);
	textAlign(LEFT, TOP);
	textSize(16);
	textStyle(BOLD);
	text(truncateText(fav.track, textW, 16), textX, textY);

	textSize(13);
	textStyle(NORMAL);
	fill(200);
	text(truncateText(fav.artist, textW, 13), textX, textY + 22);

	textSize(11);
	fill(150);
	text(fav.country, textX, textY + 42);

	// Botón de eliminar
	const delX = x + w - 20;
	const delY = y + 10;
	const delSize = 16;
	
	fill(200, 100, 100);
	textSize(delSize);
	text("✕", delX, delY);

	// Interacciones
	if (isHover && mouseIsPressed && !controlCooldown) {
		controlCooldown = true;

		// Click en eliminar
		if (dist(mouseX, mouseY, delX, delY) < 15) {
			removeFavorite(fav.id);
		}
		// Click en reproducir o en la card
		else {
			playFavorite(fav);
		}
		
		setTimeout(() => (controlCooldown = false), COOLDOWN_TIME);
	}
}

function truncateText(text, maxWidth, fontSize) {
	textSize(fontSize);
	if (textWidth(text) <= maxWidth) {
		return text;
	}
	
	let truncated = text;
	while (textWidth(truncated + "...") > maxWidth && truncated.length > 0) {
		truncated = truncated.slice(0, -1);
	}
	return truncated + "...";
}

function drawHelpUI() {
    const contentY = menuHeight;
    const contentHeight = height - menuHeight - playerHeight;

    // Fondo
    fill(30, 30, 35);
    rect(0, contentY, width, contentHeight);

    // Título
    fill(255);
    textAlign(CENTER, TOP);
    textSize(32);
    textStyle(BOLD);
    text("Comandos de Voz", width / 2, contentY + 30);

    textStyle(NORMAL);
    textSize(18);
    fill(220);

    let y = contentY + 100;
    const lineGap = 36;

    drawHelpSection("Reproducción", [
        "▶ play / reproducir / pon música",
        "⏸ pausa / parar / stop",
		"⏭ siguiente / next",
		"⏮ anterior / previous",
		"★ añadir a favoritos",
        "☆ quitar de favoritos"
    ], y);

    y += lineGap * 6;

    drawHelpSection("Navegación", [
        "🗺 ir a España",
        "🗺 quiero Argentina",
        "🗺 México",
        "📂 favoritos",
        "🏠 modo normal"
    ], y);
	
    y += lineGap * 6;

    drawHelpSection("Control", [
        "Control por voz solo funciona en modo voz",
        "Habla claro y espera un segundo entre comandos"
    ], y);
}

function drawHelpSection(title, lines, startY) {
    fill(180, 220, 180);
    textAlign(LEFT, TOP);
    textSize(22);
    textStyle(BOLD);
    text(title, 80, startY);

    textStyle(NORMAL);
    textSize(18);
    fill(220);

    lines.forEach((line, i) => {
        text("• " + line, 100, startY + 40 + i * 30);
    });
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

	drawIcon(isPlaying ? "⏸" : "▶", centerX, centerY - 5, iconSize + 4, () => togglePlay());
	if (mode !== "favorites") {
		drawIcon("⏮", centerX - spacing, centerY - 5, iconSize, () => previousSong());
		drawIcon("⏭", centerX + spacing, centerY - 5, iconSize, () => nextSong());
		drawIcon(isFavorite ? "★" : "☆", width - 60, centerY - 5, iconSize, () => toggleFavorite());
	}

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

function drawIcon(symbol, x, y, baseSize, onClick) {
	textStyle(NORMAL);
	const hover = dist(mouseX, mouseY, x, y) < baseSize * 0.8; // detectar hover
	let iconSize = baseSize;

	// Efecto hover (aumenta un poco)
	if (hover) {
		iconSize = lerp(iconSize, baseSize * 1.2, 0.2);
		fill("#A5D6A7");
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

function mouseWheel(event) {
	if (mode === "favorites") {
		favoritesScrollY = constrain(favoritesScrollY + event.delta * 0.5, 0, maxFavoritesScroll);
		return false; // Prevenir scroll de página
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	const globeDiv = select("#globe-container");
	globeDiv.position(0, menuHeight);
	globeDiv.size(windowWidth, windowHeight - menuHeight - playerHeight);
	resizeGlobe(windowWidth, windowHeight - menuHeight - playerHeight);
}

function setInteractionMode(mode) {
	if (interactionMode === mode) return;

	// Apagar todo primero
	autoRotate = true; // Reanudar rotación automática
	if (interactionMode === "handControl") {
		cleanupHandControl();
	}
	if (interactionMode === "voiceControl") {
		recognition.stop();
		voiceActive = false;
	}

	// Activar el nuevo modo
	interactionMode = mode;

	if (interactionMode === "handControl") {
		handControlActive = true;
		setupHandControl();
	} else if (interactionMode === "voiceControl") {
		setupVoiceControl();
		recognition.start();
	}
}




// ---------Lógica de reproducción---------

let playlist = [];
let currentIndex = 0;

// Motor de precarga optimizada
let isFetching = false;
let pendingFetch = false;

const INITIAL_BATCH = 2;	// primeras canciones al cambiar de país
const FETCH_BATCH = 5;		// cada recarga en background
const MIN_LEFT = 4;			// cuando queden 4 -> recargar

// Cargar música para un país dado su ID de Wikidata
async function loadMusicForCountry(wikidataId, countryName) {
	// Detener y limpiar la reproducción actual
	if (currentAudio) {
		currentAudio.stop();
		currentAudio.remove();
		currentAudio = null;
	}
	selectAll(".musicFrame").forEach(f => f.remove());
	currentSongInfo = null;
	albumArt = null;
	flagImg = null;
	isPlaying = false;

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
	currentFlagISO = iso3to2(getSelectedCountryID());
	flagImg = null;
	if (currentFlagISO) {
		const flagUrl = `https://flagcdn.com/w40/${currentFlagISO}.png`;
		loadImage(flagUrl, img => flagImg = img);
	}

	playCurrentSong();
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
		country: song.country,
		id: song.id
	};
	// Comprobar si es favorita
	isFavorite = favorites.some(f => f.id === song.id);
	// Iniciar reproducción
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

// Favoritos
function loadFavorites() {
	const saved = localStorage.getItem("musiculture_favorites");
	favorites = saved ? JSON.parse(saved) : [];
}

function saveFavorites() {
	localStorage.setItem("musiculture_favorites", JSON.stringify(favorites));
}

function loadFavoriteImages() {
	favorites.forEach(fav => {
		if (fav.artwork && !favoriteArtworks[fav.id]) {
			loadImage(fav.artwork, img => {
				favoriteArtworks[fav.id] = img;
			});
		}
		if (fav.flag && !favoriteFlagImgs[fav.flag]) {
			const flagUrl = `https://flagcdn.com/w80/${fav.flag}.png`;
			loadImage(flagUrl, img => {
				favoriteFlagImgs[fav.flag] = img;
			});
		}
	});
}

function toggleFavorite() {
	if (!currentAudio || !currentSongInfo) return;

	const favObj = {
		track: currentSongInfo.track,
		artist: currentSongInfo.artist,
		country: currentSongInfo.country,
		flag: currentFlagISO,
		previewUrl: playlist[currentIndex].previewUrl,
		artwork: playlist[currentIndex].artwork,
		id: playlist[currentIndex].id
	};

	// ¿Ya existe?
	const existing = favorites.find(f => f.id === favObj.id);

	if (existing) {
		// Eliminar
		favorites = favorites.filter(f => f.id !== favObj.id);
		isFavorite = false;
	} else {
		// Añadir
		favorites.push(favObj);
		isFavorite = true;
		// Cargar imagen si no existe
		if (favObj.artwork && !favoriteArtworks[favObj.id]) {
			loadImage(favObj.artwork, img => {
				favoriteArtworks[favObj.id] = img;
			});
		}
		if (favObj.flag && !favoriteFlagImgs[favObj.flag]) {
			const flagUrl = `https://flagcdn.com/w80/${favObj.flag}.png`;
			loadImage(flagUrl, img => {
				favoriteFlagImgs[favObj.flag] = img;
			});
		}
	}

	saveFavorites();
}

function playFavorite(fav) {
	// Detener audio actual
	if (currentAudio) {
		currentAudio.stop();
		currentAudio.remove();
		currentAudio = null;
	}
	selectAll(".musicFrame").forEach(f => f.remove());

	// Reproducir favorito
	currentAudio = createAudio(fav.previewUrl);
	currentAudio.attribute("controls", false);
	currentAudio.attribute("class", "musicFrame");
	currentAudio.style("display", "none");
	currentAudio.parent(document.body);

	// Configurar info de la canción
	currentSongInfo = {
		artist: fav.artist,
		track: fav.track,
		country: fav.country,
		id: fav.id
	};

	isFavorite = true;
	isPlaying = true;

	// Cargar portada
	if (fav.artwork) {
		albumArt = favoriteArtworks[fav.id] || null;
		if (!albumArt) {
			loadImage(fav.artwork, img => albumArt = img);
		}
	} else {
		albumArt = null;
	}

	// Cargar bandera
	currentFlagISO = fav.flag;
	flagImg = favoriteFlagImgs[fav.flag] || null;
	if (!flagImg && fav.flag) {
		const flagUrl = `https://flagcdn.com/w80/${fav.flag}.png`;
		loadImage(flagUrl, img => flagImg = img);
	}

	// Reproducir la nueva canción
	currentAudio.play();

	// Cuando termine, no hacer nada
	currentAudio.elt.addEventListener("ended", () => {
		// Al terminar, no hacer nada (no hay siguiente en el modo favoritos)
		isPlaying = false;
	});
}

function removeFavorite(id) {
	// Si la canción eliminada es la que está sonando, parar reproducción
	if (currentSongInfo && currentSongInfo.id === id) {
		if (currentAudio) {
			currentAudio.stop();
			currentAudio.remove();
		}
		currentAudio = null;
		currentSongInfo = null;
		albumArt = null;
		flagImg = null;
		isPlaying = false;
	}

    // Eliminar la cancióndel array de favoritos
    favorites = favorites.filter(f => f.id !== id);
    saveFavorites();
}