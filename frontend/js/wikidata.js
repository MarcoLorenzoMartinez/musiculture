/* wikidata.js
	 Consulta la API de Wikidata para obtener el ID de un país dado su nombre en español.
*/

async function getWikidataId(countryName) {
	// Construir la URL de la API de Wikidata
	const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&language=es&format=json&origin=*&search=${encodeURIComponent(countryName)}`;
	
	// Realizar la solicitud a la API y procesar la respuesta JSON
	try {
		const response = await fetch(url);
		const data = await response.json();

		// Devolver el ID del primer resultado encontrado
		return data.search && data.search.length > 0 ? data.search[0].id : null;
	} catch (err) {
		console.error("Error al obtener ID de Wikidata:", err);
		return null;
	}
}
