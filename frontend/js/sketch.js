/* sketch.js (p5.js)
   Interfaz visual de MUSICULTURE:
   solo barra verde superior y el globo D3 ocupando el resto del espacio.
*/

let menuHeight = 70; // Altura de la barra superior

function setup() {
  createCanvas(windowWidth, windowHeight);
  noStroke();
  textAlign(LEFT, CENTER);
  textFont("Arial");

  // Crear contenedor para el globo, debajo de la barra
  const globeDiv = select("#globe-container");
  globeDiv.position(0, menuHeight);
  globeDiv.size(windowWidth, windowHeight - menuHeight);

  // Inicializar globo
  initGlobe(async (countryName) => {
    // En esta versión no mostramos texto, solo se deja lista la lógica futura
    const wikidataId = await getWikidataId(countryName);
    console.log(`🌍 ${countryName} → ${wikidataId || "No encontrado"}`);
  });
}

function draw() {
  background(20);

  // === Barra verde superior ===
  fill("#2E7D32");
  rect(0, 0, width, menuHeight);

  // === Título del proyecto ===
  fill(255);
  textSize(28);
  text("🎵 MUSICULTURE", 25, menuHeight / 2);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Reajustar contenedor del globo
  const globeDiv = select("#globe-container");
  globeDiv.position(0, menuHeight);
  globeDiv.size(windowWidth, windowHeight - menuHeight);

  // Ajustar globo al nuevo tamaño
  resizeGlobe(windowWidth, windowHeight - menuHeight);
}
