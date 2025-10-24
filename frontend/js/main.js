// frontend/js/main.js
/* Espera a que DOM esté listo, inicializa el globo y define la acción que ejecuta al hacer clic en un país: 
muestra en info-box que está buscando el ID y usa getWikidataId para obtenerlo; luego actualiza el info-box 
y (en el futuro) podría enlazar música al país. */

document.addEventListener("DOMContentLoaded", () => { // Espera a que el DOM esté completamente cargado
  const infoBox = document.getElementById("info-box");

  // Inicializar globo y definir qué ocurre al hacer clic en un país
  initGlobe(async (countryName) => { // Callback al hacer clic en un país que actualiza info-box, obtiene ID de Wikidata, lo muestra y (futuro) enlaza música
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
