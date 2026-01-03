// --------------------------
//   VOICE CONTROL
// --------------------------
let voiceActive = false;
let recognition;

function speak(text) {
    // Detener cualquier habla en curso
    window.speechSynthesis.cancel();

    // Parar la música si está sonando
    if (currentAudio && isPlaying) {
        currentAudio.pause();
        isPlaying = false;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES'; // idioma
    utterance.rate = 1;       // velocidad
    utterance.pitch = 1;      // tono

    window.speechSynthesis.speak(utterance);
}


function setupVoiceControl() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Tu navegador no soporta reconocimiento de voz.");
        return;
    }

    voiceActive = true;

    recognition = new SpeechRecognition();
    recognition.lang = "es-ES";   // Idioma del reconocimiento
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = async (event) => {
        // Obtener la transcripción del último resultado en minúsculas y sin acentos
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
        console.log("Voz:", transcript);

        // ---- COMANDOS DE CONTROL ----
        // Parar rotación automática del globo
        const stopRotateCommands = ["no girar", "no gira", "no giro", "no rotar", "no rota"];
        if (stopRotateCommands.some(cmd => transcript === cmd)) {
            autoRotate = false;
            return;
        }
        // Iniciar rotación automática del globo
        const startRotateCommands = ["girar", "gira", "giro", "rota", "rotar"];
        if (startRotateCommands.some(cmd => transcript === cmd)) {
            autoRotate = true;
            return;
        }
        // Ampliar globo
        const zoomInCommands = ["acerca", "acercar", "cerca", "zoom", "amplia", "ampliar", "aumenta", "aumentar"];
        if (zoomInCommands.some(cmd => transcript.includes(cmd))) {
            currentScale *= 1.2;
            currentScale = Math.min(800, currentScale);
            projection.scale(currentScale);
            globe.attr("r", currentScale);
            svg.selectAll("path").attr("d", path);
            return;
        }
        // Alejar globo
        const zoomOutCommands = ["aleja", "alejar", "lejos", "reduce", "reducir", "disminuye", "disminuir"];
        if (zoomOutCommands.some(cmd => transcript.includes(cmd))) {
            currentScale *= 0.8;
            currentScale = Math.max(150, currentScale);
            projection.scale(currentScale);
            globe.attr("r", currentScale);
            svg.selectAll("path").attr("d", path);
            return;
        }
        // Parar canción
        const pauseCommands = ["pausa", "pausar", "detener", "para", "parar", "parate", "detente", "pause", "stop", "halt", "hold"];
        if (pauseCommands.some(cmd => transcript.includes(cmd))) {
            togglePlay();
            return;
        }
        // Reproducir canción
        const playCommands = ["reproducir", "reproduce", "empieza", "empezar", "arranca", "arrancar",
            "reanuda", "reanudar", "continuar", "continua",
             "play", "pon musica","start", "resume"];
        // Tiene que ser exacto para evitar conflictos con otros comandos
        if (playCommands.some(cmd => transcript === cmd)) {
            togglePlay();
            return;
        }
        // Siguiente canción
        const nextCommands = ["siguiente", "cambia", "cambiar", "pasa", "pasar", "next", "skip", "change"];
        if (nextCommands.some(cmd => transcript.includes(cmd))) {
            if (currentAudio)
                nextSong();
            return;
        }
        // Canción anterior
        const prevCommands = ["anterior", "vuelve", "volver", "regresa", "regresar"];
        if (prevCommands.some(cmd => transcript.includes(cmd))) {
            if (currentAudio)
                previousSong();
            return;
        }
        // Abrir favoritos
        if (transcript === "favoritos") {
            setMode("favorites");
            return;
        }
        // Reproducir canción específica en favoritos
        if (mode === "favorites" && transcript.startsWith("reproducir")) {
            const index = parseIndexFromSpeech(transcript);

            if (index && favorites[index - 1]) {
                playFavorite(favorites[index - 1]);
            } else{
                resetPlayer();
                speak("Ese número no es válido en la lista de favoritos");
            }
            return;
        }
        // Eliminar canción específica de favoritos
        if (mode === "favorites" && transcript.startsWith("eliminar")) {
            const index = parseIndexFromSpeech(transcript);

            if (index && favorites[index - 1]) {
                removeFavorite(favorites[index - 1].id);
            } else {
                resetPlayer();
                speak("Ese número no es válido en la lista de favoritos");
            }
            return;
        }

        // Añadir a favoritos
        const favCommands = ["me gusta", "anadir a favoritos", "favorito"];
        if (favCommands.some(cmd => transcript.includes(cmd))) {
            if (!isFavorite) {
                toggleFavorite();
            }
            return;
        }
        // Quitar de favoritos
        const unfavCommands = ["no me gusta", "quitar de favoritos", "quitar favorito", "eliminar de favoritos"];
        if (unfavCommands.some(cmd => transcript.includes(cmd))) {
            if (isFavorite) {
                toggleFavorite();
            }
            return;
        }
        // Modo normal (ratón)
        if (transcript.includes("normal")) {
            setInteractionMode("normal");
            return;
        }
        // Modo control por gestos
        if (transcript.includes("control gestual")) {
            setInteractionMode("handControl");
            return;
        }
        // Abrir ayuda
        if (transcript === "ayuda" || transcript === "help") {
            setMode("help");
            return;
        }
        // Cerrar ayuda / favoritos
        const closeCommands = ["cerrar", "volver", "salir", "close"];
        if ((mode === "help" || mode === "favorites") && closeCommands.some(c => transcript.includes(c))) {
            setMode("normal");
            return;
        }
        // País aleatorio
        if (transcript === "aleatorio" || transcript === "random") {
            selectRandomCountry();
            return;
        }
        // ---- BÚSQUEDA DE PAÍS ----
        // Ejemplos: "ir a españa", "quiero argentina", "méxico"
        const countryList = window.loadedCountries.map(c => c.properties.name.toLowerCase()); // Leemos del globo

        for (let [alias, countryEnglish] of Object.entries(countryTranslations)) {

            if (!transcript.includes(alias)) continue;
            
            if (!countryList.includes(countryEnglish.toLowerCase())) {
                console.log(`El país "${countryEnglish}" no está cargado en el globo.`);
                resetPlayer();
                clearSelectedCountry();
                speak("Ese país no está disponible en el mapa actual");
                return;
            }

            const wikidataId = await getWikidataId(countryEnglish);
            if (wikidataId) {
                console.log(`Navegando a ${countryEnglish} (${wikidataId}) por comando de voz.`);
                loadMusicForCountry(wikidataId, countryEnglish);
            }
            focusCountryByName(countryEnglish);
            return;
        }
    };

    recognition.onend = () => {
        if (voiceActive) recognition.start(); // Reiniciar automáticamente
    };
}

function selectRandomCountry() {
    if (!window.loadedCountries || window.loadedCountries.length === 0) return;

    const randomCountry =
        window.loadedCountries[Math.floor(Math.random() * window.loadedCountries.length)];

    const countryName = randomCountry.properties.name;

    console.log("País aleatorio:", countryName);

    // Centrar el globo
    focusCountryByName(countryName);

    // Cargar música
    getWikidataId(countryName).then(id => {
        if (id) loadMusicForCountry(id, countryName);
    });
}


function focusCountryByName(countryName) {
    if (!window.loadedCountries) return;

    // Detener rotación automática del globo
    autoRotate = false;

    // Buscar el país por nombre (ya normalizado)
    const country = window.loadedCountries.find(c => c.properties.name.toLowerCase() === countryName.toLowerCase());
    if (!country) return;

    selectedCountry = country;

    // Obtener el centro del país (centroid)
    const centroid = path.centroid(country);
    const [x, y] = centroid;

    // Calcular coordenadas geográficas del centroid
    const geoCentroid = d3.geoCentroid(country); // [longitud, latitud]

    // Animar la rotación del globo
    d3.transition()
        .duration(1500)
        .tween("rotate", () => {
            const r0 = rotation.slice();
            const r1 = [-geoCentroid[0], -geoCentroid[1]]; // invertir para proyección
            return t => {
                rotation[0] = r0[0] + (r1[0] - r0[0]) * t;
                rotation[1] = r0[1] + (r1[1] - r0[1]) * t;
                projection.rotate(rotation);
                svg.selectAll("path").attr("d", path);
            };
        });

    // Resaltar el país
    svg.selectAll(".country").classed("country-selected", d => d === country);
}

function parseIndexFromSpeech(text) {
    // El texto ya está en minúsculas y sin acentos
    // Número en dígitos
    const digitMatch = text.match(/\b\d+\b/);
    if (digitMatch) return parseInt(digitMatch[0], 10);

    // Número en palabras
    const numbers = {
        uno: 1,
        dos: 2,
        tres: 3,
        cuatro: 4,
        cinco: 5,
        seis: 6,
        siete: 7,
        ocho: 8,
        nueve: 9,
        diez: 10,
        once: 11,
        doce: 12,
        trece: 13,
        catorce: 14,
        quince: 15,
        dieciseis: 16,
        diecisiete: 17,
        dieciocho: 18,
        diecinueve: 19,
        veinte: 20
    };

    for (const word in numbers) {
        if (text.includes(word)) {
            return numbers[word];
        }
    }

    return null;
}



// Diccionario español/aliases a nombre en inglés
const countryTranslations = {
  "afganistan": "Afghanistan", "afghanistan": "Afghanistan",
  "albania": "Albania",
  "argelia": "Algeria", "algeria": "Algeria",
  "samoa americana": "American Samoa", "american samoa": "American Samoa",
  "andorra": "Andorra",
  "angola": "Angola",
  "anguilla": "Anguilla",
  "antartida": "Antarctica", "antarctica": "Antarctica",
  "antigua y barbuda": "Antigua and Barbuda", "antigua": "Antigua and Barbuda", "barbuda": "Antigua and Barbuda",
  "argentina": "Argentina",
  "armenia": "Armenia", "armenia": "Armenia",
  "aruba": "Aruba",
  "australia": "Australia",
  "austria": "Austria",
  "azerbaiyan": "Azerbaijan", "azerbaijan": "Azerbaijan",
  "bahamas": "Bahamas",
  "bahrein": "Bahrain", "bahrain": "Bahrain",
  "bangladesh": "Bangladesh",
  "barbados": "Barbados",
  "bielorrusia": "Belarus", "belarus": "Belarus",
  "belgica": "Belgium", "belgium": "Belgium",
  "belice": "Belize", "belize": "Belize",
  "benin": "Benin",
  "bermudas": "Bermuda", "bermuda": "Bermuda",
  "butan": "Bhutan", "bhutan": "Bhutan",
  "bolivia": "Bolivia",
  "bosnia y herzegovina": "Bosnia and Herzegovina", "bosnia": "Bosnia and Herzegovina",
  "botsuana": "Botswana", "botswana": "Botswana",
  "brasil": "Brazil", "brazil": "Brazil",
  "brunei": "Brunei",
  "bulgaria": "Bulgaria",
  "burkina faso": "Burkina Faso",
  "burundi": "Burundi",
  "cabo verde": "Cape Verde", "cape verde": "Cape Verde",
  "camboya": "Cambodia", "cambodia": "Cambodia",
  "camerun": "Cameroon", "cameroon": "Cameroon",
  "canada": "Canada", "canada": "Canada",
  "islas caiman": "Cayman Islands", "cayman islands": "Cayman Islands", "islas cayman": "Cayman Islands",
  "republica centroafricana": "Central African Republic", "central african republic": "Central African Republic", "republica centro africana": "Central African Republic",
  "chad": "Chad",
  "chile": "Chile",
  "china": "China",
  "isla de navidad": "Christmas Island", "christmas island": "Christmas Island",
  "islas cocos": "Cocos Islands", "cocos islands": "Cocos Islands",
  "colombia": "Colombia",
  "comoras": "Comoros", "comoros": "Comoros",
  "republica democratica del congo": "Democratic Republic of the Congo", "congo drc": "Democratic Republic of the Congo",
  "congo": "Republic of the Congo", "republica del congo": "Republic of the Congo", "republic of the congo": "Republic of the Congo",
  "islas cook": "Cook Islands", "cook islands": "Cook Islands",
  "costa rica": "Costa Rica",
  "costa de marfil": "Ivory Coast", "ivory coast": "Ivory Coast",
  "croacia": "Croatia",
  "cuba": "Cuba",
  "curazao": "Curaçao", "curaçao": "Curaçao", "curacao": "Curaçao",
  "chipre": "Cyprus",
  "chequia": "Czech Republic", "republica checa": "Czech Republic", "czech republic": "Czech Republic",
  "dinamarca": "Denmark",
  "yibuti": "Djibouti", "djibouti": "Djibouti",
  "dominica": "Dominica",
  "republica dominicana": "Dominican Republic", "dominican republic": "Dominican Republic",
  "ecuador": "Ecuador",
  "egipto": "Egypt",
  "el salvador": "El Salvador",
  "guinea ecuatorial": "Equatorial Guinea", "equatorial guinea": "Equatorial Guinea",
  "eritrea": "Eritrea",
  "estonia": "Estonia",
  "esuatini": "Eswatini", "suazilandia": "Eswatini", "swaziland": "Eswatini",
  "etiopia": "Ethiopia", "ethiopia": "Ethiopia",
  "islas malvinas": "Falkland Islands", "falkland islands": "Falkland Islands",
  "islas feroe": "Faroe Islands", "faroe islands": "Faroe Islands",
  "fiyi": "Fiji", "fiji": "Fiji",
  "finlandia": "Finland", "finland": "Finland",
  "guayana francesa": "French Guiana", "french guiana": "French Guiana",
  "polinesia francesa": "French Polynesia", "french polynesia": "French Polynesia",
  "francia": "France", "france": "France",
  "territorio antartico frances": "French Southern Territories", "french southern territories": "French Southern Territories",
  "gabon": "Gabon",
  "gambia": "Gambia",
  "georgia": "Georgia",
  "alemania": "Germany", "germany": "Germany",
  "ghana": "Ghana", "gana": "Ghana",
  "gibraltar": "Gibraltar",
  "grecia": "Greece",
  "groenlandia": "Greenland",
  "granada": "Grenada",
  "guadalupe": "Guadeloupe",
  "guam": "Guam",
  "guatemala": "Guatemala",
  "guernsey": "Guernsey",
  "guinea-bissau": "Guinea-Bissau", "guinea bissau": "Guinea-Bissau", "guinea bisau": "Guinea-Bissau",
  "guinea": "Guinea",
  "guyana": "Guyana",
  "haiti": "Haiti",
  "honduras": "Honduras",
  "hong kong": "Hong Kong",
  "hungria": "Hungary",
  "islandia": "Iceland",
  "india": "India",
  "indonesia": "Indonesia",
  "inglaterra": "England",
  "irlanda": "Ireland",
  "iran": "Iran",
  "iraq": "Iraq",
  "irlanda": "Ireland",
  "isla de man": "Isle of Man",
  "israel": "Israel",
  "italia": "Italy",
  "jamaica": "Jamaica",
  "japan": "Japan", "japon": "Japan",
  "jordania": "Jordan",
  "kazajistan": "Kazakhstan",
  "kenia": "Kenya",
  "kiribati": "Kiribati",
  "corea del norte": "North Korea", "north korea": "North Korea",
  "corea del sur": "South Korea", "south korea": "South Korea",
  "kuwait": "Kuwait",
  "kirguistan": "Kyrgyzstan",
  "laos": "Laos",
  "letonia": "Latvia",
  "libano": "Lebanon", "libanon": "Lebanon",
  "lesoto": "Lesotho",
  "liberia": "Liberia",
  "libia": "Libya",
  "liechtenstein": "Liechtenstein",
  "lituania": "Lithuania",
  "luxemburgo": "Luxembourg",
  "macao": "Macao",
  "madagascar": "Madagascar",
  "malaui": "Malawi",
  "malasia": "Malaysia",
  "maldivas": "Maldives",
  "mali": "Mali",
  "malta": "Malta",
  "islas marshal": "Marshall Islands", "marshall islands": "Marshall Islands",
  "martinica": "Martinique",
  "mauritania": "Mauritania",
  "islas mauricio": "Mauritius",
  "mayotte": "Mayotte",
  "mejico": "Mexico", "mexico": "Mexico",
  "micronesia": "Micronesia",
  "moldavia": "Moldova",
  "monaco": "Monaco",
  "mongolia": "Mongolia",
  "montenegro": "Montenegro",
  "montserrat": "Montserrat",
  "marruecos": "Morocco",
  "mozambique": "Mozambique",
  "birmania": "Myanmar",
  "myanmar": "Myanmar",
  "namibia": "Namibia",
  "nauru": "Nauru",
  "nepal": "Nepal",
  "paises bajos": "Netherlands", "netherlands": "Netherlands", "holanda": "Netherlands",
  "nueva caledonia": "New Caledonia", "new caledonia": "New Caledonia",
  "nueva zelanda": "New Zealand", "new zealand": "New Zealand",
  "nicaragua": "Nicaragua",
  "niger": "Niger",
  "nigeria": "Nigeria",
  "niue": "Niue",
  "isla norfolk": "Norfolk Island",
  "macedonia del norte": "North Macedonia",
  "islas marianas del norte": "Northern Mariana Islands",
  "noruega": "Norway",
  "oman": "Oman",
  "pakistan": "Pakistan",
  "palaos": "Palau",
  "palestina": "Palestine",
  "panama": "Panama",
  "papua nueva guinea": "Papua New Guinea",
  "paraguay": "Paraguay",
  "peru": "Peru",
  "filipinas": "Philippines",
  "pitcairn": "Pitcairn Islands",
  "polonia": "Poland",
  "portugal": "Portugal",
  "puerto rico": "Puerto Rico",
  "qatar": "Qatar",
  "reunion": "Réunion",
  "rumania": "Romania",
  "rusia": "Russia",
  "ruanda": "Rwanda",
  "san bartolomé": "Saint Barthélemy",
  "santa helena": "Saint Helena",
  "san cristobal y nieves": "Saint Kitts and Nevis",
  "santa lucia": "Saint Lucia",
  "san martin": "Saint Martin",
  "san pedro y miquelon": "Saint Pierre and Miquelon",
  "san vicente y las granadinas": "Saint Vincent and the Grenadines",
  "samoa": "Samoa",
  "san marino": "San Marino",
  "santo tome y principe": "Sao Tome and Principe",
  "arabia saudi": "Saudi Arabia",
  "senegal": "Senegal",
  "serbia": "Serbia",
  "seychelles": "Seychelles",
  "sierra leona": "Sierra Leone",
  "singapur": "Singapore",
  "islas sint maarten": "Sint Maarten",
  "eslovaquia": "Slovakia",
  "eslovenia": "Slovenia",
  "islas salomon": "Solomon Islands",
  "somalia": "Somalia",
  "sudafrica": "South Africa",
  "sudan del sur": "South Sudan",
  "espana": "Spain",
  "sri lanka": "Sri Lanka",
  "sudan": "Sudan",
  "surinam": "Suriname",
  "svalbard": "Svalbard",
  "suecia": "Sweden",
  "suiza": "Switzerland",
  "siria": "Syria",
  "taiwan": "Taiwan",
  "tayikistan": "Tajikistan",
  "tanzania": "Tanzania",
  "tailandia": "Thailand",
  "timor oriental": "Timor-Leste",
  "togo": "Togo",
  "tokelau": "Tokelau",
  "tonga": "Tonga",
  "trinidad y tobago": "Trinidad and Tobago",
  "tunisia": "Tunisia",
  "turquia": "Turkey",
  "turkmenistan": "Turkmenistan",
  "islas turcas y caicos": "Turks and Caicos Islands",
  "tuvalu": "Tuvalu",
  "uganda": "Uganda",
  "ucrania": "Ukraine",
  "emiratos arabes unidos": "United Arab Emirates",
  "reino unido": "United Kingdom",
  "gran bretana": "United Kingdom",
  "estados unidos": "USA", "eeuu": "USA", "usa": "USA",
  "uruguay": "Uruguay",
  "uzbekistan": "Uzbekistan",
  "vanuatu": "Vanuatu",
  "venezuela": "Venezuela",
  "vietnam": "Vietnam",
  "wallis y futuna": "Wallis and Futuna",
  "sahara occidental": "Western Sahara",
  "yemen": "Yemen",
  "zambia": "Zambia",
  "zimbabue": "Zimbabwe"
};

