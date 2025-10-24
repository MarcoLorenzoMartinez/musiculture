// frontend/js/wikidata.js
/* consulta la API de Wikidata para buscar el ID de un país a partir del nombre en español. */

// Devuelve el ID de Wikidata dado un nombre de país
async function getWikidataId(countryName) {
  // Construye la URL de la API de Wikidata
  /*
    action=wbsearchentities: indica que queremos buscar entidades.
    language=es: especifica que el nombre del país está en español.
    format=json: indica que queremos la respuesta en formato JSON.
    origin=*: permite solicitudes CORS desde cualquier origen.
    search=...: término a buscar, codificado para URL.
  */
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&language=es&format=json&origin=*&search=${encodeURIComponent(countryName)}`;
  
  try {
    const response = await fetch(url); // Hace la petición HTTP a la API de Wikidata
    const data = await response.json(); // Parsea la respuesta JSON
    
    // data.search es un array de resultados; si no está vacío, devolvemos el primer resultado
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
