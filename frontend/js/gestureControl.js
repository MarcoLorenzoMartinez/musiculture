/* gestureControl.js
	 Control del globo con gestos de la mano (ml5.handPose)
	 y del clic central mediante movimiento de cabeza (ml5.faceMesh).
*/

let video;
let handPose, faceMesh;
let hands = [];
let faces = [];

let handControlActive = false;
let lastX = null;
let lastY = null;
let gestureCooldown = 0;

// configuración del recuadro de cámara
const camW = 320;
const camH = 240;
const camMargin = 20;

// --- variables para detección de asentir ---
let lastNoseY = null;
let nodCounter = 0;
const NOD_THRESHOLD = 15; // sensibilidad del movimiento vertical
const NOD_FRAMES = 10;		// número de frames para detectar un "asentir"

function setupHandControl() {
	// Crear captura de cámara
	video = createCapture(VIDEO);
	video.size(camW, camH);
	video.hide();

	// Detener rotación automática del globo
	autoRotate = false;

	// Inicializar modelo de manos
	handPose = ml5.handPose(() => {
		console.log("✅ Modelo handPose cargado");
		handPose.detectStart(video, gotHands);
	});

	// Inicializar modelo de rostro
    async function startFaceMesh() {
        faceMesh = await ml5.faceMesh(video);
        console.log("😀 Modelo faceMesh cargado");

        while (true) {
            const predictions = await faceMesh.detect(video);
            faces = predictions;
            await new Promise(r => setTimeout(r, 100)); // ~10 FPS
        }
    }
    startFaceMesh();

	console.log("🖐 Control por gestos + asentir activado (ml5)");

	// Crear punto central en el SVG
	createCenterMarker();
}

// === Función para limpiar el control de gestos ===
function cleanupHandControl() {
	// Eliminar el punto central del SVG
	removeCenterMarker();
	
	// Detener los modelos si es necesario
	if (handPose) {
		handPose.detectStop();
	}
	
	// Detener el video
	if (video) {
		video.stop();
		video.remove();
		video = null;
	}
	
	// Resetear variables
	hands = [];
	faces = [];
	lastX = null;
	lastY = null;
	lastNoseY = null;
	nodCounter = 0;
	gestureCooldown = 0;
}

// === Crear el punto central en el SVG (visible sobre el globo) ===
function createCenterMarker() {
	d3.select("#center-marker").remove(); // evitar duplicados

	d3.select("#globe")
		.append("circle")
		.attr("id", "center-marker")
		.attr("cx", globeWidth / 2)
		.attr("cy", globeHeight / 2)
		.attr("r", 6)
		.attr("fill", "red")
		.attr("stroke", "white")
		.attr("stroke-width", 1.5)
		.style("pointer-events", "none");
}

// === Eliminar el punto central del SVG ===
function removeCenterMarker() {
	d3.select("#center-marker").remove();
	svg.selectAll(".center-dot").remove();
}

function gotHands(results) {
	hands = results;
}

function gotFaces(results) {
	faces = results;
}

function drawHandControl() {
	if (!handControlActive) return;

	const camBoxW = 200;
	const camBoxH = 150;
	const margin = 20;

	// esquina inferior derecha, justo encima de la barra verde
	const xPos = width - camBoxW - margin;
	const yPos = height - camBoxH - menuHeight - margin;

	const uiGreen = color("#2E7D32");

	// Marco
	push();
	noFill();
	stroke(uiGreen);
	strokeWeight(3);
	drawingContext.shadowBlur = 10;
	drawingContext.shadowColor = "rgba(0,255,102,0.4)";
	rect(xPos - 3, yPos - 3, camBoxW + 6, camBoxH + 6);
	pop();

	// Cámara espejo
	push();
	translate(xPos + camBoxW, yPos);
	scale(-1, 1);
	image(video, 0, 0, camBoxW, camBoxH);
	pop();

	// Dibujar manos si hay
	if (hands.length > 0) {
		drawHandsOverlay(xPos, yPos, camBoxW, camBoxH);
		processHandGesture();
	}

	// Detectar asentir
	detectNodGesture();

	// Punto rojo en el centro del globo
	drawCenterDot();

	// Debug info
	push();
	fill(255);
	noStroke();
	textSize(12);
	textAlign(RIGHT, BOTTOM);
	text(`Manos: ${hands.length}`, xPos + camBoxW - 5, yPos + camBoxH - 5);
	pop();
}

// === Dibuja un punto rojo en el centro del globo ===
function drawCenterDot() {
	// Eliminamos el punto anterior si existe
	svg.selectAll(".center-dot").remove();

	// El grupo principal del globo (normalmente el primero dentro de <svg>)
	const globeGroup = svg.select("g");
	
	// Si no existe un grupo, lo creamos en el SVG directamente
	if (globeGroup.empty()) {
		svg.append("circle")
			.attr("class", "center-dot")
			.attr("cx", globeWidth / 2)
			.attr("cy", globeHeight / 2)
			.attr("r", 6)
			.style("fill", "red")
			.style("stroke", "white")
			.style("stroke-width", 2)
			.style("pointer-events", "none");
	} else {
		// Calculamos el centro del globo (que es el centro de la proyección)
		const [cx, cy] = projection([0, 0]); // centro geográfico del mapa (lat 0, lon 0)

		globeGroup.append("circle")
			.attr("class", "center-dot")
			.attr("cx", 0)	// el grupo ya está trasladado al centro
			.attr("cy", 0)
			.attr("r", 6)
			.style("fill", "red")
			.style("stroke", "white")
			.style("stroke-width", 2)
			.style("pointer-events", "none");
	}
}

function drawHandsOverlay(xPos, yPos, w, h) {
	push();
	stroke(0, 255, 102);
	strokeWeight(2);
	noFill();

	for (let hand of hands) {
		for (let [key, point] of Object.entries(hand)) {
			if (point && typeof point.x === "number") {
				const px = map(point.x, 0, video.width, xPos + w, xPos);
				const py = map(point.y, 0, video.height, yPos, yPos + h);
				circle(px, py, 5);
			}
		}
	}
	pop();
}

// === Ambas manos controlan la rotación ===
function processHandGesture() {
	if (hands.length === 0) return;

	// Buscar cualquier mano con el dedo índice visible
	const hand = hands.find(h => h.index_finger_tip);
	if (!hand) return;

	const x = map(hand.index_finger_tip.x, 0, video.width, windowWidth, 0);
	const y = map(hand.index_finger_tip.y, 0, video.height, 0, windowHeight);

	if (lastX !== null && lastY !== null) {
		const dx = x - lastX;
		const dy = y - lastY;

		rotation[0] += dx * 0.5;
		rotation[1] -= dy * 0.3;
		rotation[1] = Math.max(-90, Math.min(90, rotation[1]));
		projection.rotate(rotation);
		svg.selectAll("path").attr("d", path);
	}

	lastX = x;
	lastY = y;
}

// === Detectar gesto de asentir (clic central) ===
function detectNodGesture() {
	if (faces.length === 0) return;
	const face = faces[0];
	if (!face.keypoints) return;

	const nose = face.keypoints.find(k => k.name === "nose_tip");
	if (!nose) return;

	const noseY = nose.y;

	if (lastNoseY !== null) {
		const dy = noseY - lastNoseY;

		if (Math.abs(dy) > NOD_THRESHOLD) {
			nodCounter++;
			if (nodCounter >= NOD_FRAMES && gestureCooldown === 0) {
				performCenterClick();
				gestureCooldown = 60;
				nodCounter = 0;
			}
		} else {
			nodCounter = 0;
		}
	}

	lastNoseY = noseY;

	if (gestureCooldown > 0) gestureCooldown--;
}

// === Detectar tecla 'C' para clic central (debug) ===
function keyPressed() {
  if (key === 'C' || key === 'c') {
    performCenterClick();
  }
}

// === Ejecutar clic central ===
function performCenterClick() {
	console.log("👉 Clic central ejecutado");
	const coords = projection.invert([globeWidth / 2, globeHeight / 2]);
	const allCountries = d3.selectAll(".country").data();

	const centeredCountry = allCountries.find(d =>
		d3.geoContains(d, coords)
	);

	if (centeredCountry) {
		console.log("✅ Asentir detectado →", centeredCountry.properties.name);

		// Visual feedback
		d3.selectAll(".country").classed("country-selected", d =>
			d.properties.name === centeredCountry.properties.name
		);

		getWikidataId(centeredCountry.properties.name).then(id => {
			if (id) loadMusicForCountry(id, centeredCountry.properties.name);
		});

		// Animación rápida en el punto rojo
		d3.select("#center-marker")
			.transition()
			.duration(150)
			.attr("r", 12)
			.attr("fill", "#00ff00")
			.transition()
			.duration(300)
			.attr("r", 6)
			.attr("fill", "red");
	} else {
		console.log("🤷‍♂️ Asentir detectado pero ningún país centrado");
	}
}

// === Obtener país centrado en el globo ===
function getCountryAtCenter() {
    console.log("Obteniendo país centrado en el globo...");
	const coords = projection.invert([globeWidth / 2, globeHeight / 2]);
	const country = d3.selectAll(".country").data().find(d =>
		d3.geoContains(d, coords)
	);
	return country || null;
}