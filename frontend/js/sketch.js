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
    return;
  }

  // Detener y eliminar música anterior
  if (currentAudio) {
    currentAudio.stop();
    currentAudio.remove();
  }
  selectAll('.musicFrame').forEach(f => f.remove());

  // Buscar una canción aleatoria de un artista aleatorio
  let songFound = false;
  const shuffledArtists = data.sort(() => Math.random() - 0.5);

  for (const artist of shuffledArtists) {
    if (songFound) break;

    const searchUrl = `https://itunes.apple.com/lookup?id=${artist.appleMusicId}&entity=song&limit=10`;
    
    try {
      const res = await fetch(searchUrl);
      const artistData = await res.json();
      console.log("🎧 Respuesta iTunes:", artistData);

      const songs = artistData.results.filter(item => item.kind === "song");

      if (songs.length > 0) {
        // Elegir una canción aleatoria
        const randomSong = random(songs);
        
        // Crear elemento de audio
        currentAudio = createAudio(randomSong.previewUrl);
        currentAudio.attribute("controls", true);
        currentAudio.attribute("class", "musicFrame");
        currentAudio.style("position", "fixed");
        currentAudio.style("bottom", "20px");
        currentAudio.style("right", "20px");
        currentAudio.style("width", "300px");
        currentAudio.style("z-index", "1000");
        currentAudio.parent(document.body);
        
        // Guardar información de la canción
        currentSongInfo = {
          artist: artist.artist,
          track: randomSong.trackName,
          country: countryName
        };
        
        // Reproducir automáticamente (opcional)
        currentAudio.play();
        
        console.log(`✅ Reproduciendo: ${randomSong.trackName} - ${artist.artist}`);
        songFound = true;
      }
    } catch (error) {
      console.error(`Error cargando música de ${artist.artist}:`, error);
    }
  }

  if (!songFound) {
    console.log("No se encontraron canciones con preview disponible");
    currentSongInfo = null;
  }
}