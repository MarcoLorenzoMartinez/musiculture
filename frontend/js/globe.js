// === GLOBE MODULE ===

const width = 800, height = 800;
let projection, path, svg, infoBox, globe;
let currentScale = 350;
let rotation = [0, 0];
let autoRotate = true;
let velocity = [-0.1, 0]; // Velocidad de rotación automática

// Inicializar el globo
function initGlobe(onCountryClick) {
  projection = d3.geoOrthographic()
    .scale(350)
    .translate([width / 2, height / 2])
    .clipAngle(90);

  path = d3.geoPath().projection(projection);
  svg = d3.select("#globe");
  infoBox = document.getElementById("info-box");

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

      startAutoRotation();
    });

  addInteraction();
}

// Rotación automática
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

// Controles de interacción (arrastrar, zoom)
function addInteraction() {
  let lastPos = null;

  svg.call(
    d3.drag()
      .on("start", (event) => {
        lastPos = [event.x, event.y];
        autoRotate = false;
      })
      .on("drag", (event) => {
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

  svg.on("wheel", (event) => {
    event.preventDefault();

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    currentScale *= zoomFactor;
    currentScale = Math.max(150, Math.min(800, currentScale));

    projection.scale(currentScale);
    globe.attr("r", currentScale);
    svg.selectAll("path").attr("d", path);
  });
}
