/* sketch.js (p5.js)
   Interfaz visual de MUSICULTURE:
   barra verde superior con logo e integración del globo D3.
*/

let menuHeight = 70; // Altura de la barra superior
let logoImg; // Imagen del logo
let currentAudio = null; // Audio activo
let currentSongInfo = null; // Información de la canción actual {artist, track, country}

function preload() {
  // Carga el logo antes de setup()
  logoImg = loadImage("frontend/assets/completo_sinFondo.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();

  // Crear contenedor para el globo debajo de la barra
  const globeDiv = select("#globe-container");
  globeDiv.position(0, menuHeight);
  globeDiv.size(windowWidth, windowHeight - menuHeight);

  // Inicializar el globo D3
  initGlobe(async (countryName) => {
    const wikidataId = await getWikidataId(countryName);
    if (wikidataId) {
      loadMusicForCountry(wikidataId, countryName);
      console.log(`🌍 ${countryName} → ${wikidataId}`);
    } else {
      console.log("No se encontró el ID de Wikidata para el país:", countryName);
    }
  });
}

function draw() {
  background(20);

  // === Barra verde superior ===
  fill("#2E7D32");
  rect(0, 0, width, menuHeight);

  // === Fondo blanco semitransparente detrás del logo ===
  fill(255, 150);
  const padding = 10;
  const logoHeight = menuHeight - padding * 2;
  const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
  const x = 25;
  const y = padding;

  rect(x - 5, y - 5, logoWidth + 10, logoHeight + 10, 8);

  // === Logo ===
  image(logoImg, x, y, logoWidth, logoHeight);

  // === Información de la canción actual ===
  if (currentSongInfo) {
    fill(255); // Texto blanco
    textSize(16);
    textAlign(LEFT, CENTER);
    textFont("Arial, sans-serif");
    
    const textX = x + logoWidth + 30;
    const textY = menuHeight / 2;
    
    // Nombre del país
    textStyle(BOLD);
    text(`🌍 ${currentSongInfo.country}`, textX, textY - 12);
    
    // Nombre de artista y canción
    textStyle(NORMAL);
    text(`🎵 ${currentSongInfo.artist} — ${currentSongInfo.track}`, textX, textY + 12);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Ajustar el contenedor del globo
  const globeDiv = select("#globe-container");
  globeDiv.position(0, menuHeight);
  globeDiv.size(windowWidth, windowHeight - menuHeight);

  resizeGlobe(windowWidth, windowHeight - menuHeight);
}

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

  // Guardar todos los artistas del país actual
  playlistArtists = data;

  // Detener música anterior
  if (currentAudio) {
    currentAudio.stop();
    currentAudio.remove();
  }
  selectAll(".musicFrame").forEach(f => f.remove());

  // Reproducir la primera canción
  await playRandomSong(countryName);
}

/**
 * Selecciona un artista aleatorio de la lista global y reproduce una canción aleatoria.
 */
async function playRandomSong(countryName) {
  if (!playlistArtists || playlistArtists.length === 0) return;

  // Elegir un artista aleatorio
  const randomArtist = random(playlistArtists);
  const searchUrl = `https://itunes.apple.com/lookup?id=${randomArtist.appleMusicId}&entity=song&limit=10`;

  try {
    const res = await fetch(searchUrl);
    const artistData = await res.json();
    const songs = artistData.results.filter(item => item.kind === "song");

    if (songs.length === 0) {
      console.log(`⚠️ ${randomArtist.artist} no tiene canciones con preview.`);
      // Intentar con otro artista
      return playRandomSong(countryName);
    }

    const randomSong = random(songs);

    // Eliminar audios anteriores
    if (currentAudio) {
      currentAudio.stop();
      currentAudio.remove();
    }
    selectAll(".musicFrame").forEach(f => f.remove());

    // Crear y configurar el nuevo audio
    currentAudio = createAudio(randomSong.previewUrl);
    currentAudio.attribute("controls", true);
    currentAudio.attribute("class", "musicFrame");
    currentAudio.style("position", "fixed");
    currentAudio.style("bottom", "20px");
    currentAudio.style("right", "20px");
    currentAudio.style("width", "300px");
    currentAudio.style("z-index", "1000");
    currentAudio.parent(document.body);

    currentSongInfo = {
      artist: randomArtist.artist,
      track: randomSong.trackName,
      country: countryName
    };

    console.log(`🎶 Reproduciendo: ${randomSong.trackName} - ${randomArtist.artist}`);
    currentAudio.play();

    // Cuando termina, reproducir otra canción
    currentAudio.elt.addEventListener("ended", async () => {
      console.log("⏭️ Canción terminada, pasando a la siguiente...");
      await playRandomSong(countryName);
    });

  } catch (error) {
    console.error(`Error cargando música de ${randomArtist.artist}:`, error);
    // Intentar con otro artista
    await playRandomSong(countryName);
  }
}