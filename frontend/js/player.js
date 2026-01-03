/* player.js
   Lógica del reproductor de música y barra inferior.
*/

let currentAudio = null;
let currentSongInfo = null;
let playlistArtists = [];
let isPlaying = false;
let albumArt = null;
let currentFlagISO = null;
let flagImg = null;

let playlist = [];
let currentIndex = 0;

let isFetching = false;
let pendingFetch = false;

const INITIAL_BATCH = 2;
const FETCH_BATCH = 5;
const MIN_LEFT = 4;

function drawPlayerBar() {
	fill("#2E7D32");
	rect(0, height - playerHeight, width, playerHeight);

	if (!currentSongInfo) return;

	const centerY = height - playerHeight / 2;
	const centerX = width / 2;

	const iconSize = 28;
	const spacing = 70;

	drawIcon(isPlaying ? "⏸" : "▶", centerX, centerY - 5, iconSize + 4, () => togglePlay());
	if (mode !== "favorites") {
		drawIcon("⏮", centerX - spacing, centerY - 5, iconSize, () => previousSong());
		drawIcon("⏭", centerX + spacing, centerY - 5, iconSize, () => nextSong());
		drawIcon(isFavorite ? "★" : "☆", width - 60, centerY - 5, iconSize, () => toggleFavorite());
	}

	if (currentAudio && currentAudio.elt.duration) {
		const progressWidth = width * 0.45;
		const barX = width / 2 - progressWidth / 2;
		const barY = height - 28;
		const barHeight = 6;

		const duration = currentAudio.elt.duration;
		const currentTime = currentAudio.elt.currentTime;
		const progress = map(currentTime, 0, duration, 0, progressWidth);

		fill(255, 40);
		rect(barX, barY, progressWidth, barHeight, 3);

		fill("#A5D6A7");
		rect(barX, barY, progress, barHeight, 3);

		if (mouseIsPressed && mouseY > barY - 5 && mouseY < barY + barHeight + 5 &&
				mouseX > barX && mouseX < barX + progressWidth) {
			const clickPos = constrain(mouseX - barX, 0, progressWidth);
			const newTime = map(clickPos, 0, progressWidth, 0, duration);
			currentAudio.elt.currentTime = newTime;
		}

		fill(255);
		textSize(12);
		textAlign(LEFT, CENTER);
		text(formatTime(currentTime), barX - 35, barY + barHeight / 2);
		textAlign(RIGHT, CENTER);
		text(formatTime(duration), barX + progressWidth + 35, barY + barHeight / 2);
	}

	const padding = 25;
	if (albumArt) {
		image(albumArt, padding, height - playerHeight + 10, 80, 80);
	}

	if (albumArt && flagImg) {
		const flagW = 26;
		const flagH = 18;
		const artX = padding;
		const artY = height - playerHeight + 10;
		const artW = 80;
		const artH = 80;
		const flagX = artX + artW - flagW + 10;
		const flagY = artY + artH - flagH + 6;
		image(flagImg, flagX, flagY, flagW, flagH);
	}

	fill(255);
	textAlign(LEFT, CENTER);
	textSize(18);
	textStyle(BOLD);
	text(currentSongInfo.track, padding + 100, centerY - 10);
	textSize(14);
	textStyle(NORMAL);
	fill(230);
	text(currentSongInfo.artist, padding + 100, centerY + 14);
}

async function loadMusicForCountry(wikidataId, countryName) {
	if (currentAudio) {
		currentAudio.stop();
		currentAudio.remove();
		currentAudio = null;
	}
	selectAll(".musicFrame").forEach(f => f.remove());
	currentSongInfo = null;
	albumArt = null;
	flagImg = null;
	isPlaying = false;

	const response = await fetch(`https://musiculture-backend.onrender.com/music/${wikidataId}`);
	const data = await response.json();

	if (!Array.isArray(data) || data.length === 0) {
		console.warn("No hay artistas disponibles para este país");
		currentSongInfo = null;
		playlist = [];
		speak(`No hay artistas disponibles para este país.`);
		return;
	}

	playlistArtists = data;
	currentIndex = 0;
	playlist = [];

	await fetchMoreSongs(countryName, INITIAL_BATCH);

	currentFlagISO = iso3to2(getSelectedCountryID());
	flagImg = null;
	if (currentFlagISO) {
		console.log("Cargando bandera para país:", countryName, currentFlagISO);
		const flagUrl = `https://flagcdn.com/w40/${currentFlagISO}.png`;
		loadImage(flagUrl, img => flagImg = img);
	}

	playCurrentSong();
}

async function fetchMoreSongs(countryName, batchSize = FETCH_BATCH) {
	if (isFetching) {
		pendingFetch = true;
		return;
	}

	isFetching = true;

	try {
		const newSongs = [];

		while (newSongs.length < batchSize && playlistArtists.length > 0) {
			const randomArtist = random(playlistArtists);
			const searchUrl = `https://itunes.apple.com/lookup?id=${randomArtist.appleMusicId}&entity=song&limit=10`;

			try {
				const res = await fetch(searchUrl);
				const artistData = await res.json();
				const songs = artistData.results.filter(item => item.kind === "song");
				if (songs.length === 0) continue;

				const randomSong = random(songs);

				newSongs.push({
					artist: randomArtist.artist,
					track: randomSong.trackName,
					country: countryName,
					previewUrl: randomSong.previewUrl,
					artwork: randomSong.artworkUrl100 || null,
					id: randomSong.trackId
				});
			} catch (err) {
				console.warn("Error precargando artista:", err);
			}
		}

		const existingIDs = new Set(playlist.map(s => s.id));
		const filtered = newSongs.filter(s => !existingIDs.has(s.id));

		playlist.push(...filtered);
	} finally {
		isFetching = false;

		if (pendingFetch) {
			pendingFetch = false;
			await fetchMoreSongs(countryName, batchSize);
		}
	}
}

function playCurrentSong() {
	if (playlist.length === 0) return;

	const song = playlist[currentIndex];

	if (currentAudio) {
		currentAudio.stop();
		currentAudio.remove();
	}

	selectAll(".musicFrame").forEach(f => f.remove());

	currentAudio = createAudio(song.previewUrl);
	currentAudio.attribute("controls", false);
	currentAudio.attribute("class", "musicFrame");
	currentAudio.style("display", "none");
	currentAudio.parent(document.body);

	currentSongInfo = {
		artist: song.artist,
		track: song.track,
		country: song.country,
		id: song.id
	};

	isFavorite = favorites.some(f => f.id === song.id);
	isPlaying = true;

	if (song.artwork) {
		loadImage(song.artwork, img => albumArt = img);
	} else {
		albumArt = null;
	}

	currentAudio.play();
	currentAudio.elt.addEventListener("ended", () => nextSong());
}

async function nextSong() {
	if (playlist.length === 0) return;

	currentIndex++;

	if (currentIndex >= playlist.length) {
		await fetchMoreSongs(currentSongInfo.country);
		currentIndex = playlist.length - 1;
	}

	playCurrentSong();

	const remaining = playlist.length - currentIndex;
	if (remaining <= MIN_LEFT) {
		fetchMoreSongs(currentSongInfo.country);
	}
}

function previousSong() {
	if (currentIndex > 0) {
		currentIndex--;
		playCurrentSong();
	}
}

function togglePlay() {
	if (!currentAudio) return;
	if (isPlaying) {
		currentAudio.pause();
		isPlaying = false;
	} else {
		currentAudio.play();
		isPlaying = true;
	}
}

function resetPlayer() {
	if (currentAudio) {
		currentAudio.stop();
		currentAudio.remove();
	}
	currentAudio = null;
	currentSongInfo = null;
	albumArt = null;
	flagImg = null;
	isPlaying = false;

	selectAll(".musicFrame").forEach(f => f.remove());
}

function playFavorite(fav) {
	if (currentAudio) {
		currentAudio.stop();
		currentAudio.remove();
		currentAudio = null;
	}
	selectAll(".musicFrame").forEach(f => f.remove());

	currentAudio = createAudio(fav.previewUrl);
	currentAudio.attribute("controls", false);
	currentAudio.attribute("class", "musicFrame");
	currentAudio.style("display", "none");
	currentAudio.parent(document.body);

	currentSongInfo = {
		artist: fav.artist,
		track: fav.track,
		country: fav.country,
		id: fav.id
	};

	isFavorite = true;
	isPlaying = true;

	if (fav.artwork) {
		albumArt = favoriteArtworks[fav.id] || null;
		if (!albumArt) {
			loadImage(fav.artwork, img => albumArt = img);
		}
	} else {
		albumArt = null;
	}

	currentFlagISO = fav.flag;
	flagImg = favoriteFlagImgs[fav.flag] || null;
	if (!flagImg && fav.flag) {
		const flagUrl = `https://flagcdn.com/w80/${fav.flag}.png`;
		loadImage(flagUrl, img => flagImg = img);
	}

	currentAudio.play();

	currentAudio.elt.addEventListener("ended", () => {
		isPlaying = false;
	});
}