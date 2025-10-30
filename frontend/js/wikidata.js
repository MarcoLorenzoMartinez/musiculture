/* wikidata.js
	 Consulta la API de Wikidata para obtener el ID de un país dado su nombre en español.
*/
async function getWikidataId(countryName) {
	const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&language=es&format=json&origin=*&search=${encodeURIComponent(countryName)}`;
	try {
		const response = await fetch(url);
		const data = await response.json();
		return data.search && data.search.length > 0 ? data.search[0].id : null;
	} catch (err) {
		console.error("Error al obtener ID de Wikidata:", err);
		return null;
	}
}
