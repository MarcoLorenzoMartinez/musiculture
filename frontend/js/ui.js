/* ui.js
   Gestión de la interfaz de usuario: barras, menús y controles visuales.
*/

let menuHeight = 70;
let playerHeight = 100;
let logoImg;
let controlCooldown = false;
const COOLDOWN_TIME = 200;

function preload() {
	logoImg = loadImage("frontend/assets/completo_sinFondo.png");
}

function drawMenuBar() {
	// Barra superior
	fill("#2E7D32");
	rect(0, 0, width, menuHeight);

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

	drawModeItem(
		"Normal",
		startX,
		baseY,
		interactionMode === "normal",
		() => setInteractionMode("normal")
	);

	drawSeparator(startX + spacing / 2, 15, menuHeight - 15);

	drawModeItem(
		"Control Gestual",
		startX + spacing,
		baseY,
		interactionMode === "handControl",
		() => setInteractionMode("handControl")
	);

	drawSeparator(startX + spacing * 3/2, 15, menuHeight - 15);

	drawModeItem(
		"Control por Voz",
		startX + spacing * 2,
		baseY,
		interactionMode === "voiceControl",
		() => setInteractionMode("voiceControl")
	);

	// Icono de favoritos en la barra superior
	const favIconSize = 40;
	const favX = width - 60;
	const favY = menuHeight / 2;

	drawIcon(mode === "favorites" ? "✕" : "★", favX, favY, favIconSize, () => {
		setMode("favorites");
	});

	// Icono de ayuda
	drawModeItem(
		"Ayuda", width - 125, baseY, mode === "help",
		() => setMode("help")
	);
}

function drawModeItem(label, x, y, active, onClick) {
	const w = textWidth(label) + 20;
	const hover = mouseX > x - w / 2 && mouseX < x + w / 2 &&
	              mouseY > y - 15 && mouseY < y + 15;

	if (active) {
		fill("#A5D6A7");
	} else if (hover) {
		fill(220);
	} else {
		fill(255);
	}

	textAlign(CENTER, CENTER);
	textSize(18);
	textStyle(active ? BOLD : NORMAL);
	text(label, x, y);

	if (mouseIsPressed && hover && !controlCooldown) {
		controlCooldown = true;
		onClick();
		setTimeout(() => controlCooldown = false, COOLDOWN_TIME);
	}
}

function drawSeparator(x, yTop, yBottom) {
	stroke(255, 120);
	strokeWeight(2);
	line(x, yTop, x, yBottom);
	noStroke();
}

function drawIcon(symbol, x, y, baseSize, onClick) {
	textStyle(NORMAL);
	const hover = dist(mouseX, mouseY, x, y) < baseSize * 0.8;
	let iconSize = baseSize;

	if (hover) {
		iconSize = lerp(iconSize, baseSize * 1.2, 0.2);
		fill("#A5D6A7");
	} else {
		fill(255);
	}

	if (mouseIsPressed && hover) {
		iconSize = baseSize * 0.85;
	}

	textAlign(CENTER, CENTER);
	textSize(iconSize);
	text(symbol, x, y);

	if (mouseIsPressed && !controlCooldown && hover) {
		controlCooldown = true;
		onClick();
		setTimeout(() => (controlCooldown = false), COOLDOWN_TIME);
	}
}

function formatTime(seconds) {
	if (isNaN(seconds)) return "0:00";
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${s < 10 ? "0" : ""}${s}`;
}

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