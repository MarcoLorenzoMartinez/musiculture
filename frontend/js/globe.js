/* globe.js
	 Crea y controla el globo con D3: proyección ortográfica, rotación y zoom.
*/

let projection, path, svg, globe;
let currentScale, rotation, autoRotate, velocity;
let globeWidth, globeHeight;
let selectedCountry = null;

function initGlobe(onCountryClick) {
	const container = document.getElementById("globe-container");
	globeWidth = container.offsetWidth;
	globeHeight = container.offsetHeight;

	currentScale = Math.min(globeWidth, globeHeight) / 2.3;
	rotation = [0, 0];
	autoRotate = true;
	velocity = [-0.1, 0];

	projection = d3.geoOrthographic()
		.scale(currentScale)
		.translate([globeWidth / 2, globeHeight / 2])
		.clipAngle(90);

	path = d3.geoPath().projection(projection);
	svg = d3.select("#globe-container").append("svg")
		.attr("id", "globe")
		.attr("width", globeWidth)
		.attr("height", globeHeight);

	// Océano
	globe = svg.append("circle")
		.attr("cx", globeWidth / 2)
		.attr("cy", globeHeight / 2)
		.attr("r", projection.scale())
		.attr("fill", "#1565C0");

	// Mapa mundial
	d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
		.then(data => {
			// === Tooltip (indicador de país) ===
			const tooltip = d3.select("body")
				.append("div")
				.attr("class", "country-tooltip")
				.style("position", "absolute")
				.style("background", "rgba(0, 0, 0, 0.75)")
				.style("color", "#fff")
				.style("padding", "6px 10px")
				.style("border-radius", "6px")
				.style("font-size", "14px")
				.style("font-family", "Arial, sans-serif")
				.style("pointer-events", "none")
				.style("opacity", 0);

			svg.selectAll("path")
				.data(data.features)
				.enter()
				.append("path")
				.attr("d", path)
				.attr("class", "country")
				.on("mouseover", (event, d) => {
					tooltip.transition().duration(150).style("opacity", 1);
					tooltip.html(d.properties.name);
					d3.select(event.currentTarget).attr("fill", "#81C784"); // iluminar país
				})
				.on("mousemove", (event) => {
					tooltip.style("left", event.pageX + 12 + "px")
								.style("top", event.pageY - 20 + "px");
				})
				.on("mouseout", (event) => {
					tooltip.transition().duration(200).style("opacity", 0);
					d3.select(event.currentTarget).attr("fill", null);
				})
				.on("click", (event, d) => {
					// Desmarcar país anterior
					svg.selectAll(".country").classed("country-selected", false);

					// Marcar país actual
					d3.select(event.currentTarget).classed("country-selected", true);
					selectedCountry = d.properties.name;

					// Notificar callback externo
					onCountryClick(d.properties.name);
				});

			startAutoRotation();
		});

	addInteraction();
}

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

// === Ajuste dinámico del tamaño ===
function resizeGlobe(newWidth, newHeight) {
	globeWidth = newWidth;
	globeHeight = newHeight;
	currentScale = Math.min(globeWidth, globeHeight) / 2.3;

	projection
		.translate([globeWidth / 2, globeHeight / 2])
		.scale(currentScale);

	d3.select("#globe")
		.attr("width", globeWidth)
		.attr("height", globeHeight);

	globe
		.attr("cx", globeWidth / 2)
		.attr("cy", globeHeight / 2)
		.attr("r", currentScale);

	svg.selectAll("path").attr("d", path);
}
