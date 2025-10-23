// === WIKIDATA MODULE ===

// Devuelve el ID de Wikidata dado un nombre de país
async function getWikidataId(countryName) {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&language=es&format=json&origin=*&search=${encodeURIComponent(countryName)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.search && data.search.length > 0) {
      return data.search[0].id;
    } else {
      return null;
    }
  } catch (err) {
    console.error("Error al obtener ID de Wikidata:", err);
    return null;
  }
}
