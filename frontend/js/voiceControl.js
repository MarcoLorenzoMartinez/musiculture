// --------------------------
//   VOICE CONTROL
// --------------------------
let voiceActive = false;
let recognition;

function setupVoiceControl() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Tu navegador no soporta reconocimiento de voz.");
        return;
    }

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
        "no girar", "no giro", "no gira", "no rotar", "no rota"
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
        const zoomOutCommands = ["aleja", "alejar", "lejos", "desampliar", "reduce", "reducir"];
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
            if (currentAudio) currentAudio.pause();
            return;
        }
        // Reproducir canción
        const playCommands = ["reproducir", "reproduce", "empieza", "empezar", "arranca", "arrancar",
            "reanuda", "reanudar", "continuar", "continua",
             "play", "pon musica","start", "resume"];
        if (playCommands.some(cmd => transcript.includes(cmd))) {
            if (currentAudio) currentAudio.play();
            return;
        }
        // Siguiente canción
        const nextCommands = ["siguiente", "cambia", "cambiar", "pasa", "pasar", "next", "skip", "change", "switch"];
        if (nextCommands.some(cmd => transcript.includes(cmd))) {
            if (currentAudio)
                nextSong();
            return;
        }
        // Canción anterior
        const prevCommands = ["anterior", "vuelve", "volver", "regresa", "regresar", "previous", "back"];
        if (prevCommands.some(cmd => transcript.includes(cmd))) {
            if (currentAudio)
                previousSong();
            return;
        }
        // Abrir favoritos
        if (transcript.includes("favoritos")) {
            mode = "favorites";
            select("#globe-container").style("display", "none");
            return;
        }
        // Añadir a favoritos
        const favCommands = ["hola"];
        if (favCommands.some(cmd => transcript.includes(cmd))) {
            toggleFavorite();
            return;
        }
        // Modo normal (globo)
        if (transcript.includes("normal")) {
            mode = "normal";
            select("#globe-container").style("display", "block");
            return;
        }

        // ---- BÚSQUEDA DE PAÍS ----
        // Ejemplos: "ir a españa", "quiero argentina", "méxico"
        const countryList = window.loadedCountries || []; // Leemos del globe

        for (let [alias, countryEnglish] of Object.entries(countryTranslations)) {
            if (transcript.includes(alias)) {
                const wikidataId = await getWikidataId(countryEnglish);
                console.log(wikidataId);
                if (wikidataId) {
                    console.log(`Navegando a ${countryEnglish} (${wikidataId}) por comando de voz.`);
                    loadMusicForCountry(wikidataId, countryEnglish);
                }
                focusCountryByName(countryEnglish);
                return;
            }
        }

    console.log(transcript);
    };

    recognition.onend = () => {
        if (voiceActive) recognition.start(); // Reiniciar automáticamente
    };
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


// Diccionario español/aliases a nombre en inglés
const countryTranslations = {
  "afganistán": "Afghanistan", "afghanistan": "Afghanistan", "afganistan": "Afghanistan",
  "albania": "Albania",
  "argelia": "Algeria", "algeria": "Algeria",
  "samoa americana": "American Samoa", "american samoa": "American Samoa",
  "andorra": "Andorra",
  "angola": "Angola",
  "anguilla": "Anguilla",
  "antártida": "Antarctica", "antarctica": "Antarctica", "antartida": "Antarctica",
  "antigua y barbuda": "Antigua and Barbuda", "antigua": "Antigua and Barbuda", "barbuda": "Antigua and Barbuda",
  "argentina": "Argentina",
  "armenía": "Armenia", "armenia": "Armenia",
  "aruba": "Aruba",
  "australia": "Australia",
  "austria": "Austria",
  "azerbaiyán": "Azerbaijan", "azerbaijan": "Azerbaijan", "azerbaiyan": "Azerbaijan",
  "bahamas": "Bahamas",
  "bahrein": "Bahrain", "bahrain": "Bahrain",
  "bangladesh": "Bangladesh",
  "barbados": "Barbados",
  "bielorrusia": "Belarus", "belarus": "Belarus",
  "bélgica": "Belgium", "belgium": "Belgium", "belgica": "Belgium",
  "belice": "Belize", "belize": "Belize",
  "benín": "Benin", "benin": "Benin", "benin": "Benin",
  "bermudas": "Bermuda", "bermuda": "Bermuda",
  "bhután": "Bhutan", "bhutan": "Bhutan",
  "bolivia": "Bolivia",
  "bosnia y herzegovina": "Bosnia and Herzegovina", "bosnia": "Bosnia and Herzegovina",
  "botsuana": "Botswana", "botswana": "Botswana",
  "brasil": "Brazil", "brazil": "Brazil",
  "brunéi": "Brunei", "brunei": "Brunei",
  "bulgaria": "Bulgaria",
  "burkina faso": "Burkina Faso",
  "burundi": "Burundi",
  "cabo verde": "Cape Verde", "cape verde": "Cape Verde",
  "camboya": "Cambodia", "cambodia": "Cambodia",
  "camerún": "Cameroon", "cameroon": "Cameroon",
  "canadá": "Canada", "canada": "Canada",
  "islas caiman": "Cayman Islands", "cayman islands": "Cayman Islands", "islas cayman": "Cayman Islands",
  "república centroafricana": "Central African Republic", "central african republic": "Central African Republic", "republica centro africana": "Central African Republic",
  "chad": "Chad",
  "chile": "Chile",
  "china": "China",
  "isla de navidad": "Christmas Island", "christmas island": "Christmas Island",
  "islas cocos": "Cocos Islands", "cocos islands": "Cocos Islands",
  "colombia": "Colombia",
  "comoras": "Comoros", "comoros": "Comoros",
  "congo": "Republic of the Congo", "republic of the congo": "Republic of the Congo",
  "república democrática del congo": "Democratic Republic of the Congo", "congo drc": "Democratic Republic of the Congo", "republica democratica del congo": "Democratic Republic of the Congo",
  "islas cook": "Cook Islands", "cook islands": "Cook Islands",
  "costa rica": "Costa Rica",
  "costa de marfil": "Ivory Coast", "ivory coast": "Ivory Coast", "côte d'ivoire": "Ivory Coast",
  "croacia": "Croatia",
  "cuba": "Cuba",
  "curazao": "Curaçao", "curaçao": "Curaçao",
  "chipre": "Cyprus",
  "chequia": "Czech Republic", "czech republic": "Czech Republic",
  "dinamarca": "Denmark",
  "yibuti": "Djibouti", "djibouti": "Djibouti",
  "dominica": "Dominica",
  "república dominicana": "Dominican Republic", "dominican republic": "Dominican Republic", "republica dominicana": "Dominican Republic",
  "ecuador": "Ecuador",
  "egipto": "Egypt",
  "el salvador": "El Salvador",
  "guinea ecuatorial": "Equatorial Guinea", "equatorial guinea": "Equatorial Guinea",
  "eritrea": "Eritrea",
  "estonia": "Estonia",
  "esuatini": "Eswatini", "swaziland": "Eswatini",
  "etiopía": "Ethiopia", "ethiopia": "Ethiopia", "etiopia": "Ethiopia",
  "islas malvinas": "Falkland Islands", "falkland islands": "Falkland Islands",
  "islas feroe": "Faroe Islands", "faroe islands": "Faroe Islands",
  "fiyi": "Fiji", "fiji": "Fiji",
  "finlandia": "Finland", "finland": "Finland",
  "francia": "France", "france": "France",
  "guayana francesa": "French Guiana", "french guiana": "French Guiana",
  "polinesia francesa": "French Polynesia", "french polynesia": "French Polynesia",
  "territorio antártico francés": "French Southern Territories", "french southern territories": "French Southern Territories", "territorio antartico frances": "French Southern Territories",
  "gabón": "Gabon", "gabon": "Gabon",
  "gambia": "Gambia",
  "georgia": "Georgia",
  "alemania": "Germany", "germany": "Germany",
  "ghana": "Ghana",
  "gibraltar": "Gibraltar",
  "grecia": "Greece",
  "groenlandia": "Greenland",
  "granada": "Grenada",
  "guadalupe": "Guadeloupe",
  "guam": "Guam",
  "guatemala": "Guatemala",
  "guernsey": "Guernsey",
  "guinea": "Guinea",
  "guinea-bisáu": "Guinea-Bissau", "guinea-bissau": "Guinea-Bissau", "guinea bisau": "Guinea-Bissau",
  "guyana": "Guyana",
  "haití": "Haiti", "haiti": "Haiti",
  "honduras": "Honduras",
  "hong kong": "Hong Kong",
  "hungría": "Hungary", "hungria": "Hungary",
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
  "japón": "Japan", "japan": "Japan", "japon": "Japan",
  "jordania": "Jordan",
  "kazajistán": "Kazakhstan", "kazajistan": "Kazakhstan",
  "kenia": "Kenya",
  "kiribati": "Kiribati",
  "corea del norte": "North Korea", "north korea": "North Korea",
  "corea del sur": "South Korea", "south korea": "South Korea",
  "kuwait": "Kuwait",
  "kirguistán": "Kyrgyzstan", "kirguistan": "Kyrgyzstan",
  "laos": "Laos",
  "letonia": "Latvia",
  "líbano": "Lebanon", "libanon": "Lebanon",
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
  "méxico": "Mexico", "méjico": "Mexico", "mejico": "Mexico", "mexico": "Mexico",
  "micronesia": "Micronesia",
  "moldavia": "Moldova",
  "mónaco": "Monaco", "monaco": "Monaco",
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
  "países bajos": "Netherlands", "netherlands": "Netherlands", "paises bajos": "Netherlands", "holanda": "Netherlands",
  "nueva caledonia": "New Caledonia", "new caledonia": "New Caledonia",
  "nueva zelanda": "New Zealand", "new zealand": "New Zealand",
  "nicaragua": "Nicaragua",
  "níger": "Niger", "niger": "Niger",
  "nigeria": "Nigeria",
  "niue": "Niue",
  "isla norfolk": "Norfolk Island",
  "macedonia del norte": "North Macedonia",
  "islas marianas del norte": "Northern Mariana Islands",
  "noruega": "Norway",
  "omán": "Oman",
  "pakistán": "Pakistan", "pakistan": "Pakistan",
  "palaos": "Palau",
  "palestina": "Palestine",
  "panamá": "Panama", "panama": "Panama",
  "papúa nueva guinea": "Papua New Guinea", "papua nueva guinea": "Papua New Guinea",
  "paraguay": "Paraguay",
  "perú": "Peru", "peru": "Peru",
  "filipinas": "Philippines",
  "pitcairn": "Pitcairn Islands",
  "polonia": "Poland",
  "portugal": "Portugal",
  "puerto rico": "Puerto Rico",
  "qatar": "Qatar",
  "reunión": "Réunion", "reunion": "Réunion",
  "rumania": "Romania",
  "rusia": "Russia",
  "ruanda": "Rwanda",
  "san bartolomé": "Saint Barthélemy",
  "santa helena": "Saint Helena",
  "san cristóbal y nieves": "Saint Kitts and Nevis", "san cristobal y nieves": "Saint Kitts and Nevis",
  "santa lucía": "Saint Lucia", "santa lucia": "Saint Lucia",
  "san martín": "Saint Martin", "san martin": "Saint Martin",
  "san pedro y miquelón": "Saint Pierre and Miquelon", "san pedro y miquelon": "Saint Pierre and Miquelon",
  "san vicente y las granadinas": "Saint Vincent and the Grenadines",
  "samoa": "Samoa",
  "san marino": "San Marino",
  "santo tomé y príncipe": "Sao Tome and Principe", "santo tome y principe": "Sao Tome and Principe",
  "arabia saudí": "Saudi Arabia", "arabia saudi": "Saudi Arabia",
  "senegal": "Senegal",
  "serbia": "Serbia",
  "seychelles": "Seychelles",
  "sierra leona": "Sierra Leone",
  "singapur": "Singapore",
  "islas sint maarten": "Sint Maarten",
  "eslovaquia": "Slovakia",
  "eslovenia": "Slovenia",
  "islas salomón": "Solomon Islands",
  "somalia": "Somalia",
  "sudáfrica": "South Africa", "sudafrica": "South Africa",
  "sudán del sur": "South Sudan", "sudan del sur": "South Sudan",
  "españa": "Spain", "espana": "Spain",
  "sri lanka": "Sri Lanka",
  "sudan": "Sudan",
  "surinam": "Suriname",
  "svalbard": "Svalbard",
  "suecia": "Sweden",
  "suiza": "Switzerland",
  "siria": "Syria",
  "taiwán": "Taiwan", "taiwan": "Taiwan",
  "tayikistán": "Tajikistan", "tayikistan": "Tajikistan",
  "tanzania": "Tanzania",
  "tailandia": "Thailand",
  "timor oriental": "Timor-Leste",
  "togo": "Togo",
  "tokelau": "Tokelau",
  "tonga": "Tonga",
  "trinidad y tobago": "Trinidad and Tobago",
  "túnez": "Tunisia", "tunez": "Tunisia",
  "turquía": "Turkey", "turquia": "Turkey",
  "turkmenistán": "Turkmenistan", "turkmenistan": "Turkmenistan",
  "islas turcas y caicos": "Turks and Caicos Islands",
  "tuvalu": "Tuvalu",
  "uganda": "Uganda",
  "ucrania": "Ukraine",
  "emiratos árabes unidos": "United Arab Emirates", "emiratos arabes unidos": "United Arab Emirates",
  "reino unido": "United Kingdom",
  "gran bretaña": "United Kingdom",
  "estados unidos": "USA", "eeuu": "USA", "usa": "USA",
  "uruguay": "Uruguay",
  "uzbekistán": "Uzbekistan", "uzbekistan": "Uzbekistan",
  "vanuatu": "Vanuatu",
  "venezuela": "Venezuela",
  "vietnam": "Vietnam",
  "wallis y futuna": "Wallis and Futuna",
  "sahara occidental": "Western Sahara",
  "yemen": "Yemen",
  "zambia": "Zambia",
  "zimbabue": "Zimbabwe"
};

