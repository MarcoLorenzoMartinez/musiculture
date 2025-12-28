// --------------------------
//   VOICE CONTROL
// --------------------------
let voiceActive = false;
let recognition;

function setupVoiceControl() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("⚠️ Tu navegador no soporta reconocimiento de voz.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "es-ES";   // Idioma del reconocimiento
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = async (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        console.log("Voz:", transcript);

        // ---- COMANDOS DE CONTROL ----
        if (transcript.includes("pausa") || transcript.includes("pause")) {
            if (currentAudio) currentAudio.pause();
            return;
        }

        if (transcript.includes("play") || transcript.includes("reproducir")) {
            if (currentAudio) currentAudio.play();
            return;
        }

        if (transcript.includes("favoritos")) {
            mode = "favorites";
            select("#globe-container").style("display", "none");
            return;
        }

        if (transcript.includes("normal")) {
            mode = "normal";
            select("#globe-container").style("display", "block");
            return;
        }

        // ---- BÚSQUEDA DE PAÍS ----
        // Ejemplos: "ir a españa", "quiero argentina", "méxico"
        const countryList = window.loadedCountries || []; // Leemos del globe

        for (let c of countryList) {
            const name = c.properties.name.toLowerCase();
            if (transcript.includes(name)) {
                const wikidataId = await getWikidataId(c.properties.name);
                if (wikidataId) {
                    loadMusicForCountry(wikidataId, c.properties.name);
                }
                return;
            }
        }

    console.log(transcript);
    };

    recognition.onend = () => {
        if (voiceActive) recognition.start(); // Reiniciar automáticamente
    };
}
