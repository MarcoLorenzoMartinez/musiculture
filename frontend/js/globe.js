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

				const countryName = d.properties.name;
				const isoCode = iso3to2(d.id);
				const flagUrl = `https://flagcdn.com/w40/${isoCode}.png`;

				tooltip.html(`
					<div style="display:flex;align-items:center;gap:8px;">
					<strong>${countryName}</strong>
					<img src="${flagUrl}" alt="Bandera de ${countryName}" width="32" height="20"
						style="border:1px solid #555; border-radius:3px;" />
					</div>
				`);

				d3.select(event.currentTarget).attr("fill", "#81C784");
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

// Conversión de código ISO3 (geojson) → ISO2 (FlagCDN)
function iso3to2(iso3) {
  const map = {
    AFG: "af", ALB: "al", DZA: "dz", AND: "ad", AGO: "ao", ARG: "ar", ARM: "am", AUS: "au",
    AUT: "at", AZE: "az", BHS: "bs", BHR: "bh", BGD: "bd", BRB: "bb", BEL: "be", BEN: "bj",
    BTN: "bt", BOL: "bo", BIH: "ba", BRA: "br", BGR: "bg", BFA: "bf", BDI: "bi", KHM: "kh",
    CMR: "cm", CAN: "ca", CHL: "cl", CHN: "cn", COL: "co", COG: "cg", CRI: "cr", HRV: "hr",
    CUB: "cu", CYP: "cy", CZE: "cz", DNK: "dk", DOM: "do", ECU: "ec", EGY: "eg", SLV: "sv",
    EST: "ee", ETH: "et", FIN: "fi", FRA: "fr", DEU: "de", GRC: "gr", GTM: "gt", HND: "hn",
    HUN: "hu", ISL: "is", IND: "in", IDN: "id", IRN: "ir", IRQ: "iq", IRL: "ie", ISR: "il",
    ITA: "it", JAM: "jm", JPN: "jp", JOR: "jo", KAZ: "kz", KEN: "ke", KOR: "kr", KWT: "kw",
    LVA: "lv", LBN: "lb", LBR: "lr", LBY: "ly", LIE: "li", LTU: "lt", LUX: "lu", MDG: "mg",
    MYS: "my", MLI: "ml", MLT: "mt", MEX: "mx", MDA: "md", MCO: "mc", MNG: "mn", MNE: "me",
    MAR: "ma", MOZ: "mz", MMR: "mm", NAM: "na", NPL: "np", NLD: "nl", NZL: "nz", NIC: "ni",
    NER: "ne", NGA: "ng", MKD: "mk", NOR: "no", OMN: "om", PAK: "pk", PAN: "pa", PRY: "py",
    PER: "pe", PHL: "ph", POL: "pl", PRT: "pt", QAT: "qa", ROU: "ro", RUS: "ru", SAU: "sa",
    SEN: "sn", SRB: "rs", SGP: "sg", SVK: "sk", SVN: "si", ZAF: "za", ESP: "es", SWE: "se",
    CHE: "ch", SYR: "sy", TWN: "tw", THA: "th", TUN: "tn", TUR: "tr", UKR: "ua", ARE: "ae",
    GBR: "gb", USA: "us", URY: "uy", VEN: "ve", VNM: "vn", ZMB: "zm", ZWE: "zw"
  };
  return map[iso3] || iso3?.substring(0, 2).toLowerCase();
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
