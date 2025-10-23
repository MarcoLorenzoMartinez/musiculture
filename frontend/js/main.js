// === MAIN ===

document.addEventListener("DOMContentLoaded", () => {
  const infoBox = document.getElementById("info-box");

  // Inicializar globo y definir qué ocurre al hacer clic en un país
  initGlobe(async (countryName) => {
    infoBox.textContent = `Buscando ID de Wikidata para ${countryName}...`;

    const wikidataId = await getWikidataId(countryName);

    if (wikidataId) {
      console.log(`✅ ${countryName} → ${wikidataId}`);
      infoBox.innerHTML = `🌍 <strong>${countryName}</strong> → Wikidata ID: <strong>${wikidataId}</strong>`;
      // Aquí podrás añadir la lógica musical
      // playMusicForCountry(wikidataId);
    } else {
      console.warn(`❌ No se encontró ID para ${countryName}`);
      infoBox.textContent = `❌ No se encontró ID de Wikidata para ${countryName}`;
    }
  });
});
