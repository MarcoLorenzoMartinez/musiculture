import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();
app.use(cors());

app.get("/music", async (req, res) => {
  const country = req.query.country;
  const key = process.env.APPLE_MUSIC_API_KEY;

  const url = `https://api.music.apple.com/v1/catalog/${country}/charts?types=songs`;
  const options = { headers: { Authorization: `Bearer ${key}` } };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener música" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
