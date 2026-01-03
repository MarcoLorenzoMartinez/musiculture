/* sketch.js (p5.js)
   Archivo principal de MUSICULTURE - Coordina todos los módulos.
*/

function setup() {
	createCanvas(windowWidth, windowHeight);
	noStroke();

	loadFavorites();
	loadFavoriteImages();

	const globeDiv = select("#globe-container");
	globeDiv.position(0, menuHeight);
	globeDiv.size(windowWidth, windowHeight - menuHeight - playerHeight);

	initGlobe(async (countryName) => {
		const wikidataId = await getWikidataId(countryName);
		if (wikidataId) {
			loadMusicForCountry(wikidataId, countryName);
		} else {
			console.log("No se encontró el ID de Wikidata para el país:", countryName);
		}
	});
}

function draw() {
	background(20);

	drawMenuBar();
	drawPlayerBar();

	if (mode === "normal") {
		drawHandControl();
	} else if (mode === "favorites") {
		drawFavoritesUI();
	} else if (mode === "help") {
		drawHelpUI();
	}
}

function mouseWheel(event) {
	if (mode === "favorites") {
		favoritesScrollY = constrain(favoritesScrollY + event.delta * 0.5, 0, maxFavoritesScroll);
		return false;
	}
	if (mode === "help" && maxHelpScroll > 0) {
		helpScrollY += event.delta;
		helpScrollY = constrain(helpScrollY, 0, maxHelpScroll);
		return false;
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	const globeDiv = select("#globe-container");
	globeDiv.position(0, menuHeight);
	globeDiv.size(windowWidth, windowHeight - menuHeight - playerHeight);
	resizeGlobe(windowWidth, windowHeight - menuHeight - playerHeight);
}