let paisSeleccionado = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(220);
  textAlign(CENTER, CENTER);
  textSize(24);
  text('Haz clic en un país para escuchar música', width / 2, height / 2);
}

function mousePressed() {
  paisSeleccionado = "España";
  fetch(`https://nombre-de-tu-api.onrender.com/music?country=${paisSeleccionado}`)
    .then(res => res.json())
    .then(data => console.log(data));
}
