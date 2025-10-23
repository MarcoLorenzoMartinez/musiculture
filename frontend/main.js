const width = 800, height = 800;

const projection = d3.geoOrthographic()
  .scale(350)
  .translate([width / 2, height / 2])
  .clipAngle(90);

const path = d3.geoPath().projection(projection);
const svg = d3.select("#globe");
const infoBox = document.getElementById("info-box");

let currentScale = 350;
let rotation = [0, 0];
let autoRotate = true;
let velocity = [-0.1, 0]; // Velocidad de rotación automática

// Fondo del globo (mar)
const globe = svg.append("circle")
  .attr("cx", width / 2)
  .attr("cy", height / 2)
  .attr("r", projection.scale())
  .attr("fill", "#1565C0");

// Función para obtener ID de Wikidata dado un nombre de país
async function getWikidataId(countryName) {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&language=es&format=json&origin=*&search=${encodeURIComponent(countryName)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.search && data.search.length > 0) {
      return data.search[0].id;
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error al obtener ID de Wikidata:", err);
    return null;
  }
}

// Cargar mapa mundial
d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
  .then(data => {
    svg.selectAll("path")
      .data(data.features)
      .enter()
      .append("path")
        .attr("d", path)
        .attr("class", "country")
        .on("click", async (event, d) => {
          const countryName = d.properties.name;
          infoBox.textContent = `Buscando ID de Wikidata para ${countryName}...`;
          
          const wikidataId = await getWikidataId(countryName);

          if (wikidataId) {
            console.log(`✅ ${countryName} → ${wikidataId}`);
            infoBox.innerHTML = `🌍 <strong>${countryName}</strong> → Wikidata ID: <strong>${wikidataId}</strong>`;
            // TODO: Agregar lógica de música
            // playMusicForCountry(wikidataId);
          } else {
            console.warn(`❌ No se encontró ID para ${countryName}`);
            infoBox.textContent = `❌ No se encontró ID de Wikidata para ${countryName}`;
          }
        });

    // Iniciar rotación automática
    startAutoRotation();
  });

// Función de rotación automática
function startAutoRotation() {
  d3.timer(() => {
    if (autoRotate) {
      rotation[0] += velocity[0];
      rotation[1] += velocity[1];
      projection.rotate(rotation);
      svg.selectAll("path").attr("d", path);
    }
  });
}

// Control manual con el ratón
let lastPos = null;
let isDragging = false;

svg.call(
  d3.drag()
    .on("start", (event) => {
      lastPos = [event.x, event.y];
      isDragging = true;
      autoRotate = false; // Pausar rotación automática al arrastrar
    })
    .on("drag", (event) => {
      const dx = event.x - lastPos[0];
      const dy = event.y - lastPos[1];
      rotation[0] += dx * 0.5;
      rotation[1] -= dy * 0.5;
      rotation[1] = Math.max(-90, Math.min(90, rotation[1])); // Limitar rotación vertical
      projection.rotate(rotation);
      svg.selectAll("path").attr("d", path);
      lastPos = [event.x, event.y];
    })
    .on("end", () => {
      isDragging = false;
    })
);

// Zoom con la rueda del ratón
svg.on("wheel", (event) => {
  event.preventDefault();
  
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
  currentScale *= zoomFactor;
  
  // Limitar el zoom
  currentScale = Math.max(150, Math.min(800, currentScale));
  
  projection.scale(currentScale);
  globe.attr("r", currentScale);
  svg.selectAll("path").attr("d", path);
});
