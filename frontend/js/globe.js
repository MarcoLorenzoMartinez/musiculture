// frontend/js/globe.js
/* Crea y controla el globo con D3: proyección ortográfica (globo 3D estilizado), 
carga del GeoJSON del mundo, dibujo de países, rotación automática, 
y controles de usuario (arrastrar para rotar y rueda para zoom). */

// Estado global del globo: tamaño, rotación y flags de interacción
const width = 800, height = 800; // Tamaño del SVG del globo
let projection, path, svg, infoBox, globe; // Variables D3 para proyección, ruta, SVG y cuadro de información
let currentScale = 350; // Escala inicial de la proyección
let rotation = [0, 0]; // Rotación inicial [longitud, latitud]
let autoRotate = true; // Flag para rotación automática
let velocity = [-0.1, 0]; // Velocidad de rotación automática

// Inicializa la proyección, dibuja el océano y carga el GeoJSON de países.
// onCountryClick: callback que será llamado con el nombre del país al hacer click.
function initGlobe(onCountryClick) {
  projection = d3.geoOrthographic() // Crea la proyección ortográfica
    .scale(currentScale)
    .translate([width / 2, height / 2]) // Centra el globo en el SVG
    .clipAngle(90); // Recorta partes no visibles para simular esfera

  path = d3.geoPath().projection(projection); // Crea el generador de rutas
  svg = d3.select("#globe"); // Selecciona el SVG del globo
  infoBox = document.getElementById("info-box"); // Selecciona el cuadro de información

  // Fondo azul (océano)
  globe = svg.append("circle")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", projection.scale())
    .attr("fill", "#1565C0");

  // Cargar mapa mundial
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
    .then(data => {
      svg.selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
          .attr("d", path)
          .attr("class", "country")
          .on("click", (event, d) => {
            onCountryClick(d.properties.name);
          });

      // Iniciar rotación automática al cargar el globo
      startAutoRotation();
    });

  // Añadir controles de interacción
  addInteraction();
}

// Rotación automática
function startAutoRotation() {
  d3.timer(() => { // Ejecuta el callback de forma continua (~60fps)
    if (autoRotate) { // Si la rotación automática está activada, actualiza la rotación
      rotation[0] += velocity[0];
      rotation[1] += velocity[1];
      projection.rotate(rotation);
      svg.selectAll("path").attr("d", path);
    }
  });
}

// Controles de interacción (arrastrar, zoom)
function addInteraction() {
  let lastPos = null;

  svg.call(
    d3.drag() // Convierte el SVG en un área arrastrable
      .on("start", (event) => { // Al iniciar el arrastre, guarda la posición inicial y desactiva la rotación automática
        lastPos = [event.x, event.y];
        autoRotate = false;
      })
      .on("drag", (event) => { // Al arrastrar, calcula el cambio de posición y actualiza la rotación
        const dx = event.x - lastPos[0];
        const dy = event.y - lastPos[1];
        rotation[0] += dx * 0.5;
        rotation[1] -= dy * 0.5;
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]));
        projection.rotate(rotation);
        svg.selectAll("path").attr("d", path);
        lastPos = [event.x, event.y];
      })
  );

  svg.on("wheel", (event) => { // Control de zoom con la rueda del ratón
    event.preventDefault();

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1; // deltaY > 0 = rueda hacia abajo = zoom out, < 0 = rueda hacia arriba = zoom in
    currentScale *= zoomFactor;
    currentScale = Math.max(150, Math.min(800, currentScale));

    // Actualiza la proyección y el radio del círculo del globo
    projection.scale(currentScale);
    globe.attr("r", currentScale);
    svg.selectAll("path").attr("d", path);
  });
}
