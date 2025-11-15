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
			// Tooltip (indicador de país)
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
						style="border:1px solid #555; border-radius:3px;" 
						onerror="this.style.display='none'" />
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

// Conversión completa de código ISO3 -> ISO2 (compatible con GeoJSON + FlagCDN)
function iso3to2(iso3) {
  const map = {
    AFG: "af", ALA: "ax", ALB: "al", DZA: "dz", ASM: "as", AND: "ad", AGO: "ao", AIA: "ai",
    ATA: "aq", ATG: "ag", ARG: "ar", ARM: "am", ABW: "aw", AUS: "au", AUT: "at", AZE: "az",
    BHS: "bs", BHR: "bh", BGD: "bd", BRB: "bb", BLR: "by", BEL: "be", BLZ: "bz", BEN: "bj",
    BMU: "bm", BTN: "bt", BOL: "bo", BES: "bq", BIH: "ba", BWA: "bw", BVT: "bv", BRA: "br",
    IOT: "io", BRN: "bn", BGR: "bg", BFA: "bf", BDI: "bi", CPV: "cv", KHM: "kh", CMR: "cm",
    CAN: "ca", CYM: "ky", CAF: "cf", TCD: "td", CHL: "cl", CHN: "cn", CXR: "cx", CCK: "cc",
    COL: "co", COM: "km", COG: "cg", COD: "cd", COK: "ck", CRI: "cr", CIV: "ci", HRV: "hr",
    CUB: "cu", CUW: "cw", CYP: "cy", CZE: "cz", DNK: "dk", DJI: "dj", DMA: "dm", DOM: "do",
    ECU: "ec", EGY: "eg", SLV: "sv", GNQ: "gq", ERI: "er", EST: "ee", SWZ: "sz", ETH: "et",
    FLK: "fk", FRO: "fo", FJI: "fj", FIN: "fi", FRA: "fr", GUF: "gf", PYF: "pf", ATF: "tf",
    GAB: "ga", GMB: "gm", GEO: "ge", DEU: "de", GHA: "gh", GIB: "gi", GRC: "gr", GRL: "gl",
    GRD: "gd", GLP: "gp", GUM: "gu", GTM: "gt", GGY: "gg", GIN: "gn", GNB: "gw", GUY: "gy",
    HTI: "ht", HMD: "hm", VAT: "va", HND: "hn", HKG: "hk", HUN: "hu", ISL: "is", IND: "in",
    IDN: "id", IRN: "ir", IRQ: "iq", IRL: "ie", IMN: "im", ISR: "il", ITA: "it", JAM: "jm",
    JPN: "jp", JEY: "je", JOR: "jo", KAZ: "kz", KEN: "ke", KIR: "ki", PRK: "kp", KOR: "kr",
    KWT: "kw", KGZ: "kg", LAO: "la", LVA: "lv", LBN: "lb", LSO: "ls", LBR: "lr", LBY: "ly",
    LIE: "li", LTU: "lt", LUX: "lu", MAC: "mo", MDG: "mg", MWI: "mw", MYS: "my", MDV: "mv",
    MLI: "ml", MLT: "mt", MHL: "mh", MTQ: "mq", MRT: "mr", MUS: "mu", MYT: "yt", MEX: "mx",
    FSM: "fm", MDA: "md", MCO: "mc", MNG: "mn", MNE: "me", MSR: "ms", MAR: "ma", MOZ: "mz",
    MMR: "mm", NAM: "na", NRU: "nr", NPL: "np", NLD: "nl", NCL: "nc", NZL: "nz", NIC: "ni",
    NER: "ne", NGA: "ng", NIU: "nu", NFK: "nf", MKD: "mk", MNP: "mp", NOR: "no", OMN: "om",
    PAK: "pk", PLW: "pw", PSE: "ps", PAN: "pa", PNG: "pg", PRY: "py", PER: "pe", PHL: "ph",
    PCN: "pn", POL: "pl", PRT: "pt", PRI: "pr", QAT: "qa", REU: "re", ROU: "ro", RUS: "ru",
    RWA: "rw", BLM: "bl", SHN: "sh", KNA: "kn", LCA: "lc", MAF: "mf", SPM: "pm", VCT: "vc",
    WSM: "ws", SMR: "sm", STP: "st", SAU: "sa", SEN: "sn", SRB: "rs", SYC: "sc", SLE: "sl",
    SGP: "sg", SXM: "sx", SVK: "sk", SVN: "si", SLB: "sb", SOM: "so", ZAF: "za", SGS: "gs",
    SSD: "ss", ESP: "es", LKA: "lk", SDN: "sd", SUR: "sr", SJM: "sj", SWE: "se", CHE: "ch",
    SYR: "sy", TWN: "tw", TJK: "tj", TZA: "tz", THA: "th", TLS: "tl", TGO: "tg", TKL: "tk",
    TON: "to", TTO: "tt", TUN: "tn", TUR: "tr", TKM: "tm", TCA: "tc", TUV: "tv", UGA: "ug",
    UKR: "ua", ARE: "ae", GBR: "gb", USA: "us", URY: "uy", UZB: "uz", VUT: "vu", VEN: "ve",
    VNM: "vn", WLF: "wf", ESH: "eh", YEM: "ye", ZMB: "zm", ZWE: "zw"
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

// Ajuste dinámico del tamaño
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
