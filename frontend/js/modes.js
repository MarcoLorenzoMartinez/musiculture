/* modes.js
   Gestión de modos de visualización e interacción.
*/

let mode = "normal"; // "normal", "favorites", "help"
let interactionMode = "normal"; // "normal", "handControl", "voiceControl"

// Cambiar modo de visualización
function setMode(newMode) {
	// Si ya está en el modo, volver a normal
	if (mode === newMode) {
		mode = "normal";
		select("#globe-container").style("display", "block");
		return;
	}

	// Cambiar al nuevo modo
	mode = newMode;

	// Reiniciar desplazamientos si es necesario
	if (mode === "favorites") {
		favoritesScrollY = 0;
	}
	if (mode === "help") {
		helpScrollY = 0;
	}

	select("#globe-container").style("display", "none");

	// Si el modo es favoritos, limpiar selección y reiniciar reproductor
	if (mode === "favorites") {
		clearSelectedCountry();
		resetPlayer();
	}
}

// Cambiar modo de interacción
function setInteractionMode(newMode) {
	// Si ya está en el modo, no hacer nada
	if (interactionMode === newMode) return;

	// Limpiar el modo anterior
	autoRotate = true;
	if (interactionMode === "handControl") {
		cleanupHandControl();
	}
	if (interactionMode === "voiceControl") {
		recognition.stop();
		voiceActive = false;
	}

	// Configurar el nuevo modo
	interactionMode = newMode;
	
	if (interactionMode === "handControl") {
		handControlActive = true;
		setupHandControl();
	} else if (interactionMode === "voiceControl") {
		setupVoiceControl();
		recognition.start();
	}
}