const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API = process.env.TMDB_API_KEY;

async function test() {
  const res3 = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API}&with_watch_providers=8&watch_region=US`);
  const data3 = await res3.json();
  console.log("Movies with watch provider 8 (Netflix):", data3.total_results);

  const res4 = await fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API}&with_watch_providers=8&watch_region=US`);
  const data4 = await res4.json();
  console.log("TV with watch provider 8 (Netflix):", data4.total_results);
}
test();
