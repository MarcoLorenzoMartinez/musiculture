/* gestureControl.js
	 Control del globo con gestos de la mano (ml5.handPose).
	 - Mano derecha: rotación del globo.
	 - Mano izquierda: puño (clic central).
*/

let video;
let handPose;
let hands = [];

let handControlActive = false;
let lastX = null;
let lastY = null;
let gestureCooldown = 0;

// Configuración del recuadro de cámara
const camW = 320;
const camH = 240;
const camMargin = 20;

// Configurar el control de gestos
function setupHandControl() {
	// Crear captura de cámara
	video = createCapture(VIDEO);
	video.size(camW, camH);
	video.hide();

	// Detener rotación automática del globo
	autoRotate = false;

	// Inicializar modelo de manos
	handPose = ml5.handPose(() => {
		console.log("Modelo handPose cargado");
		handPose.detectStart(video, gotHands);
	});

	console.log("Control por gestos activado (ml5)");

	// Crear punto central en el SVG
	createCenterMarker();
}

// Limpiar el control de gestos
function cleanupHandControl() {
	// Eliminar el punto central del SVG
	removeCenterMarker();
	handControlActive = false;
	autoRotate = true;

	console.log("Control por gestos desactivado");

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
	lastX = null;
	lastY = null;
	gestureCooldown = 0;
}

// Crear el punto central en el SVG (visible sobre el globo)
function createCenterMarker() {
	d3.select("#center-marker").remove(); // Evitar duplicados

	// Crear el círculo rojo en el centro del SVG
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

// Eliminar el punto central del SVG
function removeCenterMarker() {
	d3.select("#center-marker").remove();
	svg.selectAll(".center-dot").remove();
}

// Callback cuando se detectan manos
function gotHands(results) {
	hands = results;
}

// Dibujar la interfaz de control por gestos
function drawHandControl() {
	if (!handControlActive) return;

	// Dimensiones y posición del recuadro de cámara
	const camBoxW = 200;
	const camBoxH = 150;
	const margin = 20;

	// Esquina inferior derecha, justo encima de la barra verde
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
}

// Dibujar puntos de las manos sobre el recuadro de cámara
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

// Procesar gestos de las manos
// La mano derecha controla la rotación, la izquierda el clic central
function processHandGesture() {
	if (hands.length === 0) return;

	// Mano derecha (por el efecto espejo es la "Left" detectada)
	const rightHand = hands.find(h => h.handedness === "Left");
	if (rightHand && rightHand.index_finger_tip) {
    // Mapeo de la posición del dedo índice
		const x = map(rightHand.index_finger_tip.x, 0, video.width, windowWidth, 0);
		const y = map(rightHand.index_finger_tip.y, 0, video.height, 0, windowHeight);

    // Si hay una posición previa, calcular el delta para rotar el globo
		if (lastX !== null && lastY !== null) {
			const dx = x - lastX;
			const dy = y - lastY;

      // Actualizar rotación del globo
			rotation[0] += dx * 0.5;
			rotation[1] -= dy * 0.3;
			rotation[1] = Math.max(-90, Math.min(90, rotation[1]));
			projection.rotate(rotation);
			svg.selectAll("path").attr("d", path);
		}

    // Actualizar última posición
		lastX = x;
		lastY = y;
	}

	// Mano izquierda (por el espejo es la "Right") -> puño = clic
	const leftHand = hands.find(h => h.handedness === "Right");
	if (leftHand && leftHand.index_finger_tip && leftHand.thumb_tip) {
		const distance = dist(
			leftHand.index_finger_tip.x, leftHand.index_finger_tip.y,
			leftHand.thumb_tip.x, leftHand.thumb_tip.y
		);

		// Si los dedos están cerca -> puño = clic central
		if (distance < 30 && gestureCooldown === 0) {
			performCenterClick();
			gestureCooldown = 60; // cooldown para evitar múltiples clics
		}
	}

  // Reducir cooldown
	if (gestureCooldown > 0) gestureCooldown--;
}

// Ejecutar clic central
function performCenterClick() {
	console.log("Clic central ejecutado");
  // Obtener las coordenadas geográficas del centro del globo
	const coords = projection.invert([globeWidth / 2, globeHeight / 2]);
	const allCountries = d3.selectAll(".country").data();

  // Encontrar el país que contiene esas coordenadas
	const centeredCountry = allCountries.find(d =>
		d3.geoContains(d, coords)
	);

  // Si hay un país centrado, cargar su música
	if (centeredCountry) {
		console.log("Puño detectado ->", centeredCountry.properties.name);

		// Buscar el país por nombre
		const country = window.loadedCountries.find(c => c.properties.name.toLowerCase() === centeredCountry.properties.name.toLowerCase());
		if (!country) return;

    // Actualizar país seleccionado
		selectedCountry = country;

		// Resaltar país seleccionado
		d3.selectAll(".country").classed("country-selected", d =>
			d.properties.name === centeredCountry.properties.name
		);

    // Cargar música del país
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
		console.log("Puño detectado pero ningún país centrado");
	}
}
