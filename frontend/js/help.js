/* help.js
   Sistema de ayuda y documentación de la aplicación.
*/

let helpScrollY = 0;
let maxHelpScroll = 0;

// Dibujar la interfaz de ayuda
function drawHelpUI() {
	// Área de contenido
	const contentY = menuHeight;
	const contentHeight = height - menuHeight - playerHeight;

	// Fondo
	fill(30, 30, 35);
	rect(0, contentY, width, contentHeight);

	// Encabezado
	drawHelpHeader(contentY);

	textStyle(NORMAL);
	textSize(18);
	fill(220);

	// Contenido según el modo de interacción
	if (interactionMode === "voiceControl") {
		drawVoiceHelp(contentHeight, contentY);
	} else if (interactionMode === "handControl") {
		drawHandHelp(contentHeight, contentY);
	} else {
		drawGeneralHelp(contentHeight, contentY);
	}
}

// Dibujar el encabezado de la ayuda
function drawHelpHeader(contentY) {
	fill(255);
	textAlign(CENTER, TOP);
	textSize(32);
	textStyle(BOLD);
	// Título según el modo de interacción
	if (interactionMode === "normal") {
		text("Uso de la aplicación", width / 2, contentY + 30);
	} else if (interactionMode === "handControl") {
		text("Comandos de Control Gestual", width / 2, contentY + 30);
	} else if (interactionMode === "voiceControl") {
		text("Control por voz", width / 2, contentY + 30);
	}
}

// Dibujar una sección de ayuda con título y líneas de texto
function drawHelpSection(title, lines, x, startY) {
	// Título de la sección
	fill(180, 220, 180);
	textAlign(LEFT, TOP);
	textSize(22);
	textStyle(BOLD);
	text(title, x, startY);

	textStyle(NORMAL);
	textSize(18);
	fill(220);

	// Líneas de la sección con viñetas
	lines.forEach((line, i) => {
		text("• " + line, x + 20, startY + 40 + i * 30);
	});
}

// Dibujar la ayuda para el modo normal
function drawGeneralHelp(contentHeight, contentY) {
	// Posición inicial del contenido
	const startY = contentY + 90;
	const lineGap = 36;
	let y = startY - helpScrollY;
	let x = 80;

	// Cálculo del scroll máximo
	const totalContentHeight = lineGap * 30;
	maxHelpScroll = max(0, totalContentHeight - contentHeight + 120);

	// Dibujo con recorte
	push();
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(0, startY, width, contentHeight - 90);
	drawingContext.clip();

	// Secciones de ayuda
	drawHelpSection("¿Qué es MUSICULTURE?", [
		"MUSICULTURE es una app interactiva para descubrir música del mundo",
		"Explora países en el globo y escucha artistas locales",
		"Cada país genera una playlist diferente automáticamente"
	], x, y);

	// Separación entre secciones
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

	// Restaurar contexto
	drawingContext.restore();
	pop();

	// Indicador de scroll (si es necesario)
	if (maxHelpScroll > 0) {
		fill(150);
		textSize(14);
		textAlign(CENTER, BOTTOM);
		text("↕ Usa la rueda del ratón para desplazarte", width / 2, height - playerHeight - 10);
	}
}

// Dibujar la ayuda para el modo de control por voz
function drawVoiceHelp(contentHeight, contentY) {
	// Secciones de ayuda
	const sections = [
		{
			title: "Control del globo",
			lines: [
				"Gira(r) / Giro / Rota(r) → Inicia rotación automática",
				"No gira(r) / No giro / No rota(r) → Para la rotación automática",
				"Acerca(r) / Aumenta(r) / Amplía(r) / zoom → Amplía el globo",
				"Aleja(r) / Reducir / Disminuir → Aleja el globo"
			]
		},
		{
			title: "Reproducción de música",
			lines: [
				"Reproducir / Play / Empezar / Reanuda(r) → Reproduce la canción",
				"Pausa(r) / Para(r) / Stop → Pausa la canción",
				"Siguiente / Cambia(r) / Pasa(r) / Skip / Next → Siguiente canción",
				"Anterior / Vuelve / Volver / Regresa(r) → Canción anterior"
			]
		},
		{
			title: "Favoritos y navegación",
			lines: [
				"Favoritos → Abrir lista de favoritos",
				"Añadir a favoritos / Favorito / Me gusta → Añade la canción a favoritos",
				"Quitar de favoritos / Eliminar de favoritos / Eliminar favorito / No me gusta → Quita la canción de favoritos",
				"Ayuda / Help → Abrir ayuda",
				"Cerrar / Volver / Salir / Close → Cerrar ayuda o favoritos",
				"Normal → Volver al modo normal (globo)",
				"Control gestual → Cambiar al modo de control por gestos"
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
				"[Nombre del país] → Selecciona un país y reproduce música de ese país",
				"Ejemplos: 'España', 'Argentina', 'México'",
				"Aleatorio / Random → Te lleva a un país seleccionado al azar"
			]
		},
		{
			title: "Consejos",
			lines: [
				"Habla claro y espera un segundo entre comandos",
				"El control por voz solo funciona en este modo",
				"En caso de fallo, puedes seguir usando el ratón como en el modo normal"
			]
		}
	];

	// Ancho de columna
	const colWidth = width / 2 - 40;
	let col = 0;
	let rowY = contentY + 80;

	// Dibujar las secciones
	sections.forEach(section => {
		const x = 40 + col * (colWidth + 40);

		// Dibujar la sección de ayuda
		drawHelpSection(section.title, section.lines, x, rowY);

		// Actualizar posición para la siguiente sección, si es necesario cambiar de columna
		rowY += section.lines.length * 30 + 50;
		if (rowY > contentHeight - 200) {
			col++;
			rowY = contentY + 80;
		}
	});
}

// Dibujar la ayuda para el modo de control gestual
function drawHandHelp(contentHeight, contentY) {
	// Secciones de ayuda
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
				"Se recomienda usar ambas manos: derecha para rotar, izquierda para seleccionar",
				"Evita mover demasiado rápido la mano para una detección precisa",
				"El recuadro de cámara muestra la posición de tus manos",
				"En caso de fallo, puedes seguir usando el ratón como en el modo normal"
			]
		}
	];

	// Ancho de columna
	const colWidth = width / 2 - 40;
	let col = 0;
	let rowY = contentY + 80;

	// Dibujar las secciones
	sections.forEach(section => {
		const x = 40 + col * (colWidth + 40);

		// Dibujar la sección de ayuda
		drawHelpSection(section.title, section.lines, x, rowY);

		// Actualizar posición para la siguiente sección, si es necesario cambiar de columna
		rowY += section.lines.length * 30 + 50;
		if (rowY > contentHeight - 100) {
			col++;
			rowY = contentY + 80;
		}
	});
}