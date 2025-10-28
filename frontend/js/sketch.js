/* sketch.js (p5.js)
   Interfaz visual de MUSICULTURE:
   barra verde superior con logo e integración del globo D3.
*/

let menuHeight = 70; // Altura de la barra superior
let logoImg; // Imagen del logo

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
    console.log(`🌍 ${countryName} → ${wikidataId || "No encontrado"}`);
  });
}

function draw() {
  background(20);

  // === Barra verde superior ===
  fill("#2E7D32");
  rect(0, 0, width, menuHeight);

  // === Fondo blanco semitransparente detrás del logo ===
  fill(255, 150); // blanco con transparencia (255 blanco, 150 alfa transparente)
  const padding = 10;
  const logoHeight = menuHeight - padding * 2;
  const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
  const x = 25; // margen izquierdo
  const y = padding;

  rect(x - 5, y - 5, logoWidth + 10, logoHeight + 10, 8);

  // === Logo ===
  image(logoImg, x, y, logoWidth, logoHeight);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Ajustar el contenedor del globo
  const globeDiv = select("#globe-container");
  globeDiv.position(0, menuHeight);
  globeDiv.size(windowWidth, windowHeight - menuHeight);

  resizeGlobe(windowWidth, windowHeight - menuHeight);
}
