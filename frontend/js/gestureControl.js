/* gestureControl.js
   Control del globo con gestos de la mano (usando ml5.handPose + p5).
*/

let video;
let handPose;
let hands = [];

let handControlActive = false;
let lastX = null;
let lastY = null;
let gestureCooldown = 0;

// configuración del recuadro de cámara
const camW = 320;
const camH = 240;
const camMargin = 20;

function setupHandControl() {
  // Crear captura de cámara
  video = createCapture(VIDEO);
  video.size(camW, camH);
  video.hide();

  // Inicializar modelo
  handPose = ml5.handPose(() => {
    console.log("✅ Modelo handPose cargado");
    handPose.detectStart(video, gotHands);
  });

  console.log("🖐 Control por gestos activado (ml5.handPose)");
}

function gotHands(results) {
  hands = results;
}

function drawHandControl() {
  if (!handControlActive) return;

  const camBoxW = 200;
  const camBoxH = 150;
  const margin = 20;

  // esquina inferior derecha, justo encima de la barra verde
  const xPos = width - camBoxW - margin;
  const yPos = height - camBoxH - menuHeight - margin;

  // === Marco con el mismo verde del menú ===
  const uiGreen = color("#2E7D32");

  push();
  noFill();
  stroke(uiGreen);
  strokeWeight(3);
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = "rgba(0,255,102,0.4)";
  rect(xPos - 3, yPos - 3, camBoxW + 6, camBoxH + 6);
  pop();

  // === Mostrar cámara invertida (modo espejo) ===
  push();
  translate(xPos + camBoxW, yPos); // mover el origen
  scale(-1, 1); // invertir horizontalmente
  image(video, 0, 0, camBoxW, camBoxH);
  pop();

  // === Dibujar puntos de la mano ===
  if (hands.length > 0) {
    drawHandsOverlay(xPos, yPos, camBoxW, camBoxH);
    processHandGesture();
  }

  // === Dibujar punto rojo en el centro del globo ===
  push();
  fill(255, 0, 0);
  noStroke();
  const cx = globeWidth / 2;
  const cy = globeHeight / 2;
  circle(cx, cy, 10); // tamaño del punto
  pop();


  // === Texto de debugging ===
  push();
  fill(255);
  noStroke();
  textSize(12);
  textAlign(RIGHT, BOTTOM);
  text(`Manos: ${hands.length}`, xPos + camBoxW - 5, yPos + camBoxH - 5);
  pop();
}

function drawHandsOverlay(xPos, yPos, w, h) {
  push();
  stroke(0, 255, 102); 
  strokeWeight(2);
  noFill();

  for (let hand of hands) {
    for (let [key, point] of Object.entries(hand)) {
      if (point && typeof point.x === "number") {
        // invertir horizontalmente los puntos para que coincidan con la imagen
        const px = map(point.x, 0, video.width, xPos + w, xPos);
        const py = map(point.y, 0, video.height, yPos, yPos + h);
        circle(px, py, 5);
      }
    }
  }
  pop();
}

// === Procesar gestos y acciones por mano ===
function processHandGesture() {
  if (hands.length === 0) return;

  // Filtrar manos por tipo
  const rightHand = hands.find(h => h.handedness === "Right");
  const leftHand = hands.find(h => h.handedness === "Left");

  // === MANO DERECHA: controla la rotación del globo ===
  if (rightHand && rightHand.index_finger_tip) {
    const x = map(rightHand.index_finger_tip.x, 0, video.width, windowWidth, 0);
    const y = map(rightHand.index_finger_tip.y, 0, video.height, 0, windowHeight);

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

  // === MANO IZQUIERDA: simula un click en el centro del globo ===
  if (leftHand && leftHand.index_finger_tip && gestureCooldown === 0) {
    const isIndexExtended = isIndexFingerExtended(leftHand);
    if (isIndexExtended) {
      const centeredCountry = getCountryAtCenter();
      if (centeredCountry) {
        console.log("👆 Click con mano izquierda →", centeredCountry.properties.name);
        svg.selectAll(".country").classed("country-selected", false);
        d3.select(`[data-name='${centeredCountry.properties.name}']`)
          .classed("country-selected", true);

        getWikidataId(centeredCountry.properties.name).then(id => {
          if (id) loadMusicForCountry(id, centeredCountry.properties.name);
        });
      } else {
        console.log("👆 Mano izquierda detectada, pero ningún país en el centro");
      }

      gestureCooldown = 60;
    }
  }

  if (gestureCooldown > 0) gestureCooldown--;
}

// === Detectar si el dedo índice está extendido (para mano izquierda) ===
function isIndexFingerExtended(hand) {
  const tip = hand.index_finger_tip;
  const mcp = hand.index_finger_mcp;
  if (tip && mcp) {
    const d = dist(tip.x, tip.y, mcp.x, mcp.y);
    return d > 50; // si está suficientemente extendido
  }
  return false;
}

// === Obtener país centrado en el globo ===
function getCountryAtCenter() {
  const coords = projection.invert([globeWidth / 2, globeHeight / 2]);
  const country = d3.selectAll(".country").data().find(d =>
    d3.geoContains(d, coords)
  );
  return country || null;
}
