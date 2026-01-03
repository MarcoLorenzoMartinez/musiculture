/* help.js
   Sistema de ayuda y documentación de la aplicación.
*/

let helpScrollY = 0;
let maxHelpScroll = 0;

function drawHelpUI() {
	const contentY = menuHeight;
	const contentHeight = height - menuHeight - playerHeight;

	fill(30, 30, 35);
	rect(0, contentY, width, contentHeight);

	drawHelpHeader(contentY);

	textStyle(NORMAL);
	textSize(18);
	fill(220);

	if (interactionMode === "voiceControl") {
		drawVoiceHelp(contentHeight, contentY);
	} else if (interactionMode === "handControl") {
		drawHandHelp(contentHeight, contentY);
	} else {
		drawGeneralHelp(contentHeight, contentY);
	}
}

function drawHelpHeader(contentY) {
	fill(255);
	textAlign(CENTER, TOP);
	textSize(32);
	textStyle(BOLD);
	if (interactionMode === "normal") {
		text("Uso de la aplicación", width / 2, contentY + 30);
	} else if (interactionMode === "handControl") {
		text("Comandos de Control Gestual", width / 2, contentY + 30);
	} else if (interactionMode === "voiceControl") {
		text("Control por voz", width / 2, contentY + 30);
	}
}

function drawHelpSection(title, lines, x, startY) {
	fill(180, 220, 180);
	textAlign(LEFT, TOP);
	textSize(22);
	textStyle(BOLD);
	text(title, x, startY);

	textStyle(NORMAL);
	textSize(18);
	fill(220);

	lines.forEach((line, i) => {
		text("• " + line, x + 20, startY + 40 + i * 30);
	});
}

function drawGeneralHelp(contentHeight, contentY) {
	const startY = contentY + 90;
	const lineGap = 36;
	let y = startY - helpScrollY;
	let x = 80;

	const totalContentHeight = lineGap * 30;
	maxHelpScroll = max(0, totalContentHeight - contentHeight + 120);

	push();
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(0, startY, width, contentHeight - 90);
	drawingContext.clip();

	drawHelpSection("¿Qué es MUSICULTURE?", [
		"MUSICULTURE es una app interactiva para descubrir música del mundo",
		"Explora países en el globo y escucha artistas locales",
		"Cada país genera una playlist diferente automáticamente"
	], x, y);

	y += lineGap * 4;

	drawHelpSection("Explorar países", [
		"Haz click sobre un país en el globo",
		"El globo gira automáticamente hasta que interactúas",
		"Mantén pulsado el botón izquierdo del ratón y arrastra para rotar el globo",
		"Usa la rueda del ratón para hacer zoom",
		"Pasa el ratón sobre un país para ver su nombre",
		"Al seleccionar un país, la música comienza automáticamente"
	], x, y);

	y += lineGap * 6.5;

	drawHelpSection("Reproductor de música", [
		"▶ Reproducir",
		"⏸ Pausar",
		"⏮ Canción anterior",
		"⏭ Siguiente canción",
		"Barra de progreso interactiva",
		"Música asociada al país seleccionado"
	], x, y);

	y += lineGap * 6.5;

	drawHelpSection("Favoritos", [
		"★ Añadir la canción actual a favoritos",
		"☆ Quitar la canción actual de favoritos",
		"Pulsa el icono ★ (esquina superior derecha) para abrir la lista de favoritos",
		"Desde favoritos puedes reproducir una canción haciendo click sobre ella",
		"Usa el botón ✕ para eliminarla de la lista",
		"Los favoritos se guardan automáticamente"
	], x, y);

	y += lineGap * 6.5;

	drawHelpSection("Modos de interacción", [
		"Modo Normal: ratón y controles clásicos",
		"Modo de Control Gestual: controla la app con gestos de la mano",
		"Modo de Control por Voz: controla la app usando distintos comandos de voz"
	], x, y);

	drawingContext.restore();
	pop();

	if (maxHelpScroll > 0) {
		fill(150);
		textSize(14);
		textAlign(CENTER, BOTTOM);
		text("↕ Usa la rueda del ratón para desplazarte", width / 2, height - playerHeight - 10);
	}
}

function drawVoiceHelp(contentHeight, contentY) {
	const sections = [
		{
			title: "Control del globo",
			lines: [
				"gira(r) / giro / rota(r) → Inicia rotación automática",
				"no gira(r) / no giro / no rota(r) → Para la rotación automática",
				"acerca(r) / aumenta(r) / amplía(r) / zoom → Amplía el globo",
				"aleja(r) / reducir / disminuir → Aleja el globo"
			]
		},
		{
			title: "Reproducción de música",
			lines: [
				"reproducir / play / empezar / reanuda(r) → Reproduce la canción",
				"pausa(r) / para(r) / stop → Pausa la canción",
				"siguiente / cambia(r) / pasa(r) / skip / next → Siguiente canción",
				"anterior / vuelve / volver / regresa(r) → Canción anterior"
			]
		},
		{
			title: "Favoritos y navegación",
			lines: [
				"favoritos → Abrir lista de favoritos",
				"añadir a favoritos / favorito / me gusta → Añade / quita canción de favoritos",
				"ayuda / help → Abrir ayuda",
				"cerrar / volver / salir / close → Cerrar ayuda o favoritos",
				"normal → Volver al modo normal (globo)",
				"control gestual → Cambiar al modo de control por gestos"
			]
		},
		{
			title: "Pestaña de favoritos",
			lines: [
				"Reproducir [número] → Reproduce la canción indicada de tu lista de favoritos (ej. «Reproducir 3»)",
				"Eliminar [número] → Elimina la canción indicada de tu lista de favoritos (ej. «Eliminar 2»)",
				"Cerrar / Volver / Salir / Close → Salir de favoritos"
			]
		},
		{
			title: "Búsqueda de países",
			lines: [
				"ir a [país] / quiero [país] → Selecciona un país y reproduce música de ese país",
				"Ejemplos: 'ir a España', 'quiero Argentina', 'México'"
			]
		},
		{
			title: "Consejos",
			lines: [
				"Habla claro y espera un segundo entre comandos",
				"El control por voz solo funciona en este modo",
				"Se puede combinar con el ratón para interactuar con el globo si es necesario"
			]
		}
	];

	const colWidth = width / 2 - 40;
	let col = 0;
	let rowY = contentY + 80;

	sections.forEach(section => {
		const x = 40 + col * (colWidth + 40);

		drawHelpSection(section.title, section.lines, x, rowY);

		rowY += section.lines.length * 30 + 50;
		if (rowY > contentHeight - 200) {
			col++;
			rowY = contentY + 80;
		}
	});
}

function drawHandHelp(contentHeight, contentY) {
	const sections = [
		{
			title: "Rotación del globo",
			lines: [
				"Mano derecha → mover el globo",
				"Mantén el dedo índice y mueve la mano para rotar",
				"El globo no rota automáticamente en este modo"
			]
		},
		{
			title: "Seleccionar país (clic central)",
			lines: [
				"Mano izquierda → hacer puño para clic central",
				"El clic selecciona el país centrado en el globo",
				"Se reproduce automáticamente la música del país seleccionado",
				"Animación rápida en el punto rojo indica que se ha seleccionado"
			]
		},
		{
			title: "Teclado y consejos",
			lines: [
				"Tecla 'C' → simula un clic central (opcional)",
				"Se recomienda usar ambas manos: derecha para rotar, izquierda para seleccionar",
				"Evita mover demasiado rápido la mano para una detección precisa",
				"El recuadro de cámara muestra la posición de tus manos"
			]
		}
	];

	const colWidth = width / 2 - 40;
	let col = 0;
	let rowY = contentY + 80;

	sections.forEach(section => {
		const x = 40 + col * (colWidth + 40);

		drawHelpSection(section.title, section.lines, x, rowY);

		rowY += section.lines.length * 30 + 50;
		if (rowY > contentHeight - 100) {
			col++;
			rowY = contentY + 80;
		}
	});
}