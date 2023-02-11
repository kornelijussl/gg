const {plot, Plot} = require('nodeplotlib');
const Chart = require('chart.js/auto');
const geolib = require('geolib');
const {getDistance, getCenter, getCenterOfBounds} = require('geolib');

const players = {
  0: {x: 1, y: 2},
  1: {x: 3, y: 1},
  2: {x: 2, y: 3},
};

const players3 = {
  ...players,
  4: {x: 2, y: 2},
};

const players2 = [
  {longitude: 3, latitude: 1},
  {longitude: 2, latitude: 3},
  {longitude: 5, latitude: 4},
];

console.log(getCenterOfBounds(players2));

return;

let sumOfx = 0;
let sumOfy = 0;

for (const key in players3) {
  sumOfx += players3[key].x;
  sumOfy += players3[key].y;
}

const numberOfPlayers = Object.keys(players3).length;

const averageX = sumOfx / numberOfPlayers;
const averageY = sumOfy / numberOfPlayers;

console.log(averageX);
console.log(averageY);
