/* modes.js
   Gestión de modos de visualización e interacción.
*/

let mode = "normal"; // "normal" / "favorites" / "help"
let interactionMode = "normal"; // "normal", "handControl" o "voiceControl"

function setMode(newMode) {
	if (mode === newMode) {
		mode = "normal";
		select("#globe-container").style("display", "block");
		return;
	}

	mode = newMode;

	if (mode === "favorites") {
		favoritesScrollY = 0;
	}
	if (mode === "help") {
		helpScrollY = 0;
	}

	select("#globe-container").style("display", "none");

	if (mode === "favorites") {
		clearSelectedCountry();
		resetPlayer();
	}
}

function setInteractionMode(newMode) {
	if (interactionMode === newMode) return;

	autoRotate = true;
	if (interactionMode === "handControl") {
		cleanupHandControl();
	}
	if (interactionMode === "voiceControl") {
		recognition.stop();
		voiceActive = false;
	}

	interactionMode = newMode;

	if (interactionMode === "handControl") {
		handControlActive = true;
		setupHandControl();
	} else if (interactionMode === "voiceControl") {
		setupVoiceControl();
		recognition.start();
	}
}