/* sketch.js (p5.js)
   Controla toda la interfaz visual (fondo, textos, etc.)
   e integra la funcionalidad del globo y Wikidata.
*/

let infoText = "Haz clic en un país 🌍 | Arrastra para rotar | Rueda del ratón para zoom";
let currentCountry = null;
let wikidataId = null;

function setup() {
  // Crear el lienzo de p5
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  textFont("Arial");

  // Crear el contenedor donde D3 dibujará el globo
  const globeDiv = createDiv().id("globe");
  globeDiv.parent("globe-container");

  // Inicializar el globo
  initGlobe(async (countryName) => {
    // Actualizar texto informativo
    infoText = `Buscando ID de Wikidata para ${countryName}...`;

    // Obtener ID de Wikidata
    wikidataId = await getWikidataId(countryName);

    // Mostrar resultados en pantalla
    if (wikidataId) {
      currentCountry = countryName;
      infoText = `🌍 ${countryName} → Wikidata ID: ${wikidataId}`;
      console.log(`✅ ${countryName} → ${wikidataId}`);
      // TODO: lógica para reproducir música del país usando el ID de Wikidata
    } else {
      infoText = `❌ No se encontró ID de Wikidata para ${countryName}`;
      console.warn(infoText);
    }
  });
}

function draw() {
  background(255); // Fondo blanco
  fill(0); // Texto negro

  // Título principal
  textSize(48);
  text("MUSICULTURE", width / 2, 60);

  // Texto informativo inferior
  textSize(18);
  text(infoText, width / 2, height - 50);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
