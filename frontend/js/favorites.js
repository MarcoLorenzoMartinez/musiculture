/* favorites.js
   Gestión de canciones favoritas: almacenamiento, visualización y reproducción.
*/

let favorites = [];
let isFavorite = false;
let favoriteArtworks = {};
let favoriteFlagImgs = {};
let favoritesScrollY = 0;
let maxFavoritesScroll = 0;
const MAX_FAVORITES = 20;

function loadFavorites() {
	const saved = localStorage.getItem("musiculture_favorites");
	favorites = saved ? JSON.parse(saved) : [];
}

function saveFavorites() {
	localStorage.setItem("musiculture_favorites", JSON.stringify(favorites));
}

function loadFavoriteImages() {
	favorites.forEach(fav => {
		if (fav.artwork && !favoriteArtworks[fav.id]) {
			loadImage(fav.artwork, img => {
				favoriteArtworks[fav.id] = img;
			});
		}
		if (fav.flag && !favoriteFlagImgs[fav.flag]) {
			const flagUrl = `https://flagcdn.com/w80/${fav.flag}.png`;
			loadImage(flagUrl, img => {
				favoriteFlagImgs[fav.flag] = img;
			});
		}
	});
}

function toggleFavorite() {
	if (!currentAudio || !currentSongInfo) return;

	const favObj = {
		track: currentSongInfo.track,
		artist: currentSongInfo.artist,
		country: currentSongInfo.country,
		flag: currentFlagISO,
		previewUrl: playlist[currentIndex].previewUrl,
		artwork: playlist[currentIndex].artwork,
		id: playlist[currentIndex].id
	};

	const existing = favorites.find(f => f.id === favObj.id);

	if (existing) {
		favorites = favorites.filter(f => f.id !== favObj.id);
		isFavorite = false;
	} else {
        // Límite de favoritos
        if (favorites.length >= MAX_FAVORITES) {
            console.warn("Máximo de favoritos alcanzado");
            speak("Has alcanzado el máximo de canciones favoritas.");
            return;
        }

        favorites.push(favObj);
        isFavorite = true;

		if (favObj.artwork && !favoriteArtworks[favObj.id]) {
			loadImage(favObj.artwork, img => {
				favoriteArtworks[favObj.id] = img;
			});
		}
		if (favObj.flag && !favoriteFlagImgs[favObj.flag]) {
			const flagUrl = `https://flagcdn.com/w80/${favObj.flag}.png`;
			loadImage(flagUrl, img => {
				favoriteFlagImgs[favObj.flag] = img;
			});
		}
	}

	saveFavorites();
}

function removeFavorite(id) {
	if (currentSongInfo && currentSongInfo.id === id) {
		if (currentAudio) {
			currentAudio.stop();
			currentAudio.remove();
		}
		currentAudio = null;
		currentSongInfo = null;
		albumArt = null;
		flagImg = null;
		isPlaying = false;
	}

	favorites = favorites.filter(f => f.id !== id);
	saveFavorites();
}

function drawFavoritesUI() {
	const contentY = menuHeight;
	const contentHeight = height - menuHeight - playerHeight;
	
	fill(30, 30, 35);
	rect(0, contentY, width, contentHeight);

	fill(255);
	textAlign(CENTER, TOP);
	textSize(32);
	textStyle(BOLD);
	text("Mis Favoritos", width / 2, contentY + 30);

	if (favorites.length === 0) {
		fill(200);
		textSize(18);
		textStyle(NORMAL);
		text("No tienes canciones favoritas aún", width / 2, contentY + 100);
		text("¡Explora países y añade música que te guste!", width / 2, contentY + 130);
		return;
	}

	const cardWidth = 280;
	const cardHeight = 100;
	const gap = 20;
	const cols = Math.floor((width - 60) / (cardWidth + gap));
	const startX = (width - (cols * (cardWidth + gap) - gap)) / 2;
	const startY = contentY + 90;

	const rows = Math.ceil(favorites.length / cols);
	const totalHeight = rows * (cardHeight + gap);
	maxFavoritesScroll = max(0, totalHeight - contentHeight + 120);

	push();
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(0, startY, width, contentHeight - 90);
	drawingContext.clip();

	favorites.forEach((fav, index) => {
		const col = index % cols;
		const row = Math.floor(index / cols);
		const x = startX + col * (cardWidth + gap);
		const y = startY + row * (cardHeight + gap) - favoritesScrollY;

		if (y + cardHeight > contentY && y < contentY + contentHeight) {
			drawFavoriteCard(fav, x, y, cardWidth, cardHeight, index);
		}
	});

	drawingContext.restore();
	pop();

	if (maxFavoritesScroll > 0) {
		fill(100);
		textSize(14);
		textAlign(CENTER, BOTTOM);
		text("↕ Usa la rueda del ratón para desplazarte", width / 2, height - playerHeight - 10);
	}
}

function drawFavoriteCard(fav, x, y, w, h, index) {
	const isHover = mouseX > x && mouseX < x + w && 
	                mouseY > y && mouseY < y + h;

	if (isHover) {
		fill(60, 80, 60);
		stroke(140, 200, 140);
		strokeWeight(2);
	} else {
		fill(45, 50, 55);
		stroke(70, 75, 80);
		strokeWeight(1);
	}
	rect(x, y, w, h, 8);
	noStroke();

    // Número de favorito
    const badgeSize = 22;
    const badgeX = x - 10;
    const badgeY = y - 10;

    fill(90, 150, 90);
    noStroke();
    rect(badgeX, badgeY, badgeSize, badgeSize, 6);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(12);
    textStyle(BOLD);
    text(index + 1, badgeX + badgeSize / 2, badgeY + badgeSize / 2);

	const artSize = 80;
	const artX = x + 10;
	const artY = y + 10;

	if (favoriteArtworks[fav.id]) {
		image(favoriteArtworks[fav.id], artX, artY, artSize, artSize);
	} else {
		fill(80);
		rect(artX, artY, artSize, artSize, 4);
		fill(150);
		textSize(12);
		textAlign(CENTER, CENTER);
		text("♪", artX + artSize / 2, artY + artSize / 2);
	}

	if (fav.flag && favoriteFlagImgs[fav.flag]) {
		const flagW = 24;
		const flagH = 16;
		const flagX = artX + artSize - flagW + 8;
		const flagY = artY + artSize - flagH + 6;
		image(favoriteFlagImgs[fav.flag], flagX, flagY, flagW, flagH);
	}

	const textX = artX + artSize + 12;
	const textY = y + 15;
	const textW = w - artSize - 60;

	fill(255);
	textAlign(LEFT, TOP);
	textSize(16);
	textStyle(BOLD);
	text(truncateText(fav.track, textW, 16), textX, textY);

	textSize(13);
	textStyle(NORMAL);
	fill(200);
	text(truncateText(fav.artist, textW, 13), textX, textY + 22);

	textSize(11);
	fill(150);
	text(fav.country, textX, textY + 42);

	const delX = x + w - 20;
	const delY = y + 10;
	const delSize = 16;
	
	fill(200, 100, 100);
	textSize(delSize);
	text("✕", delX, delY);

	if (isHover && mouseIsPressed && !controlCooldown) {
		controlCooldown = true;

		if (dist(mouseX, mouseY, delX, delY) < 15) {
			removeFavorite(fav.id);
		} else {
			playFavorite(fav);
		}
		
		setTimeout(() => (controlCooldown = false), COOLDOWN_TIME);
	}
}