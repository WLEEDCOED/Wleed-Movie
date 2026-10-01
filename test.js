async function findOuterFn() {
  const url = 'https://vidstuck.xyz/_next/static/chunks/2v0q6md6--q27.js';
  const js = await fetch(url).then(r => r.text());
  const idx = js.indexOf('Sandbox Detected');
  // let's print 1700000 to 1705000
  console.log(js.substring(1700000, 1705000));
}
findOuterFn();
