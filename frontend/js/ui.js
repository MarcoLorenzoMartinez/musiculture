/* ui.js
   Gestión de la interfaz de usuario: barras, menús y controles visuales.
*/

let menuHeight = 70;
let playerHeight = 100;
let logoImg;
let controlCooldown = false;
const COOLDOWN_TIME = 200;

// Precargar recursos
function preload() {
	logoImg = loadImage("frontend/assets/completo_sinFondo.png");
}

// Dibujar la barra superior con el logo y los modos
function drawMenuBar() {
	// Barra superior
	fill("#2E7D32");
	rect(0, 0, width, menuHeight);

	// Logo
	fill(255, 150);
	const padding = 10;
	const logoHeight = menuHeight - padding * 2;
	const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
	const x = 25;
	const y = padding;

	rect(x - 5, y - 5, logoWidth + 10, logoHeight + 10, 8);
	image(logoImg, x, y, logoWidth, logoHeight);

	// Modos de juego
	const baseY = menuHeight / 2;
	const startX = 230;
	const spacing = 150;

	// Modo de interacción
	drawModeItem(
		"Normal",
		startX,
		baseY,
		interactionMode === "normal",
		() => setInteractionMode("normal")
	);

	drawSeparator(startX + spacing / 2, 15, menuHeight - 15);

	// Modo de control gestual
	drawModeItem(
		"Control Gestual",
		startX + spacing,
		baseY,
		interactionMode === "handControl",
		() => setInteractionMode("handControl")
	);

	drawSeparator(startX + spacing * 3/2, 15, menuHeight - 15);

	// Modo de control por voz
	drawModeItem(
		"Control por Voz",
		startX + spacing * 2,
		baseY,
		interactionMode === "voiceControl",
		() => setInteractionMode("voiceControl")
	);

	// Icono de ayuda
	drawModeItem(
		"Ayuda", width - 125, baseY, mode === "help",
		() => setMode("help")
	);

	// Icono de favoritos en la barra superior
	const favIconSize = 40;
	const favX = width - 60;
	const favY = menuHeight / 2;

	drawIcon(mode === "favorites" ? "✕" : "★", favX, favY, favIconSize, () => {
		setMode("favorites");
	});
}

// Dibujar un elemento de modo (texto con interacción)
function drawModeItem(label, x, y, active, onClick) {
	// Calcular si el ratón está sobre el elemento
	const w = textWidth(label) + 20;
	const hover = mouseX > x - w / 2 && mouseX < x + w / 2 &&
	              mouseY > y - 15 && mouseY < y + 15;

	// Dibujar el texto con estilos según el estado
	if (active) {
		fill("#A5D6A7");
	} else if(hover) {
		fill(220);
	} else {
		fill(255);
	}

	// Dibujar el texto centrado
	textAlign(CENTER, CENTER);
	textSize(18);
	textStyle(active ? BOLD : NORMAL);
	text(label, x, y);

	// Gestionar el clic con cooldown
	if (mouseIsPressed && hover && !controlCooldown) {
		controlCooldown = true;
		onClick();
		setTimeout(() => controlCooldown = false, COOLDOWN_TIME);
	}
}

// Dibujar un separador vertical
function drawSeparator(x, yTop, yBottom) {
	stroke(255, 120);
	strokeWeight(2);
	line(x, yTop, x, yBottom);
	noStroke();
}

// Dibujar un icono (símbolo) con interacción
function drawIcon(symbol, x, y, baseSize, onClick) {
	textStyle(NORMAL);
	// Calcular si el ratón está sobre el icono
	const hover = dist(mouseX, mouseY, x, y) < baseSize * 0.8;
	let iconSize = baseSize;

	// Dibujar el icono con efectos de hover y clic
	if (hover) {
		iconSize = lerp(iconSize, baseSize * 1.2, 0.2);
		fill("#A5D6A7");
	} else {
		fill(255);
	}
	if (mouseIsPressed && hover) {
		iconSize = baseSize * 0.85;
	}

	// Dibujar el símbolo centrado
	textAlign(CENTER, CENTER);
	textSize(iconSize);
	text(symbol, x, y);

	// Gestionar el clic con cooldown
	if (mouseIsPressed && !controlCooldown && hover) {
		controlCooldown = true;
		onClick();
		setTimeout(() => (controlCooldown = false), COOLDOWN_TIME);
	}
}

// Formatear tiempo en mm:ss
function formatTime(seconds) {
	if (isNaN(seconds)) return "0:00";
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s < 10 ? "0" : ""}${s}`;
}

// Truncar texto con "..." si excede el ancho máximo
function truncateText(text, maxWidth, fontSize) {
	textSize(fontSize);
	if (textWidth(text) <= maxWidth) {
		return text;
	}
	
	let truncated = text;
	while (textWidth(truncated + "...") > maxWidth && truncated.length > 0) {
		truncated = truncated.slice(0, -1);
	}
	return truncated + "...";
}