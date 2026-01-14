/* sketch.js (p5.js)
   Archivo principal que une todos los módulos y gestiona el ciclo de dibujo.
*/

// Preparación inicial del sketch
function setup() {
	// Crear el canvas
	createCanvas(windowWidth, windowHeight);
	noStroke();

	// Cargar datos iniciales
	loadFavorites();
	loadFavoriteImages();

	// Posicionar y dimensionar el globo
	const globeDiv = select("#globe-container");
	globeDiv.position(0, menuHeight);
	globeDiv.size(windowWidth, windowHeight - menuHeight - playerHeight);

	// Inicializar el globo con el callback de clic en país
	initGlobe(async (countryName) => {
		const wikidataId = await getWikidataId(countryName);
		if (wikidataId) {
			loadMusicForCountry(wikidataId, countryName);
		} else {
			console.log("No se encontró el ID de Wikidata para el país:", countryName);
		}
	});
}

// Bucle de dibujo principal
function draw() {
	// Fondo
	background(20);

	// Dibujar las barras superior e inferior
	drawMenuBar();
	drawPlayerBar();

	// Dibujar los contenidos según el modo
	if (mode === "normal") {
		drawHandControl();
	} else if (mode === "favorites") {
		drawFavoritesUI();
	} else if (mode === "help") {
		drawHelpUI();
	}
}

// Gestión del scroll con la rueda del ratón
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

// Ajustar el canvas y el globo al redimensionar la ventana
function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	const globeDiv = select("#globe-container");
	globeDiv.position(0, menuHeight);
	globeDiv.size(windowWidth, windowHeight - menuHeight - playerHeight);
	resizeGlobe(windowWidth, windowHeight - menuHeight - playerHeight);
}