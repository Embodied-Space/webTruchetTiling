/**
 * @typedef {Object} TileData
 * @property {integer} x
 * @property {integer} y
 * @property {Tri[]} links
 * @property {boolean} forced
 */

var svg, tileGroup;
/**
 * @type {TileData[][]}
 */
var tileData;
/**
 * @type {HTMLInputElement}
 */
var inCols;
/**
 * @type {HTMLInputElement}
 */
var inRows;
/**
 * @type {HTMLInputElement}
 */
var inScale;
var tileBase;
var svgElement;

var tileRows = 10;
var tileCols = 10;
var tileScale = 100;

document.addEventListener("DOMContentLoaded", e => {
  inCols = document.getElementById("inCols");
  inCols.value = tileCols;
  inCols.addEventListener("change", inputUpdate);
  inRows = document.getElementById("inRows");
  inRows.value = tileRows;
  inRows.addEventListener("change", inputUpdate);
  inScale = document.getElementById("inScale");
  inScale.value = tileScale;
  inScale.addEventListener("change", updateScale);
  tileBase = document.getElementsByTagName("rect")[0];
  svgElement = document.getElementsByTagName("svg")[0];

  svg = document.getElementsByTagName("svg")[0];
  tileGroup = document.getElementById("tileGroup");
  initTileData();
  resolveTiles();
  renderTiles();
});
/**
 * @readonly
 * @enum {number}
 */
var Tri = {
  NO: 0,
  YES: 1,
  MAYBE: 2
}
function initTileData() {
  tileData = [];
  for (var xi = 0; xi < tileCols; xi++) {
    tileData.push([]);
    for (var yi = 0; yi < tileRows; yi++) {
      tileData[xi].push(createTile(xi, yi));
    }
  }
}

/**
 * 
 * if no links array provided, will fill with Tri.MAYBE
 * @param {integer} xi
 * @param {integer} yi
 * @param {Tri[]} links 
 */
function createTile(xi, yi, links) {
  let tile = { links: links || [], x: xi, y: yi, forced: false };
  if (!links) {
    for (var tl = 0; tl < 6; tl++) {
      tile.links.push(Tri.MAYBE);
    }
  }
  return tile;
}

/**
 * 
 * @param {boolean} force 
 */
function resetTileData(force = false) {
  for (var column of tileData) {
    for (var tile of column) {
      if (force || !tile.forced) {
        for (var i = 0; i < tile.links.length; i++){
          tile.links[i] = Tri.MAYBE;
        }
      }
      if (force) {
        tile.forced = false;
      }
    }
  }
}
/**
 * 
 * @param {number} x 
 * @param {number} y 
 * @returns {TileData[]}
 */
function getNeighbors(x, y) {
  let onTop = y == 0;
  let onBottom = y == tileData[0].length - 1;
  let onRight = x == tileData.length - 1;
  let onLeft = x == 0;
  let oddColumn = (x % 2) == 1;
  if (oddColumn) {
    return [
      onTop ? null : tileData[x][y - 1],
      onRight ? null : tileData[x + 1][y],
      onRight || onBottom ? null : tileData[x + 1][y + 1],
      onBottom ? null : tileData[x][y + 1],
      onLeft || onBottom ? null : tileData[x - 1][y + 1],
      onLeft ? null : tileData[x - 1][y]
    ]
  } else {
    return [
      onTop ? null : tileData[x][y - 1],
      onRight || onTop ? null : tileData[x + 1][y - 1],
      onRight ? null : tileData[x + 1][y],
      onBottom ? null : tileData[x][y + 1],
      onLeft ? null : tileData[x - 1][y],
      onLeft || onTop ? null : tileData[x - 1][y - 1]
    ]
  }
}

function randomInt(limit) {
  return Math.floor(Math.random() * limit);
}
function resolveTiles() {
  recursiveResolveTile(randomInt(tileData.length), randomInt(tileData[0].length));
  /*
  for (var xi = 0; xi < tileData.length;  xi++) {
    for (var yi = 0; yi < tileData[xi].length; yi++) {
      resolveTile(xi, yi);
    }
  }
    */
}
/**
 * 
 * @param {integer} x 
 * @param {integer} y 
 */
function recursiveResolveTile(x, y) {
  if (tileData[x][y].links.find(x => x == Tri.MAYBE)) {
    resolveTile(x, y);
    for (var neighbor of getNeighbors(x, y)) {
      if (neighbor != null) {
        recursiveResolveTile(neighbor.x, neighbor.y);
      }
    }
  }
}

/**
 * 
 * @param {integer} x 
 * @param {integer} y 
 */
function resolveTile(x, y) {
  let tile = tileData[x][y];
  let neighbors = getNeighbors(x, y);
  let yesses = [];
  let possibles = [];
  for (var li = 0; li < tile.links.length; li++) {
    if (neighbors[li] == null) {
      tile.links[li] = Tri.NO;
    } else {
      switch (neighbors[li].links[(li + 3) % 6]) {
        case Tri.MAYBE:
          switch (tile.links[li]) {
            case Tri.MAYBE:
              possibles.push(li);
              break;
            case Tri.YES:
              yesses.push(li);
              break;
            case Tri.NO:
              break;
          }
          break;
        case Tri.YES:
          switch (tile.links[li]) {
            case Tri.NO:
            //TODO: do we swap to yes, or allow for ambiguity?
            case Tri.MAYBE:
              tile.links[li] = Tri.YES;
              yesses.push(li);
              break;
            case Tri.YES:
              yesses.push(li);
              break;
          }
          break;
        case Tri.NO:
          switch (tile.links[li]) {
            case Tri.YES:
            case Tri.MAYBE:
              tile.links[li] = Tri.NO;
              break;
            case Tri.NO:
              break;
          }
          break;
      }
    }
  }
  if (possibles.length > 0) {
    var numPossible = possibles.length;
    var oddYesses = yesses.length % 2 == 1;
    var oddPossibles = numPossible % 2 == 1;
    //if we have an odd number of yesses
    //lets add an odd number of possibles
    if (oddYesses && !oddPossibles) {
      numPossible--;
      oddPossible = !oddPossibles
    } else if (!oddYesses && oddPossibles) {
      //add an even number of possibles
      numPossible--;
      oddPossible = !oddPossibles
    }
    var numPossibleNoPairs = Math.floor(numPossible / 2);
    var numNewNos = 0; //Math.floor(Math.pow(Math.random(), 2) * numPossibleNoPairs) * 2;
    var numNewYesses = numPossible - numNewNos;
    shuffle(possibles);
    for (var pi = 0; pi < possibles.length; pi++) {
      if (pi < numNewYesses) {
        tile.links[possibles[pi]] = Tri.YES;
      } else {
        tile.links[possibles[pi]] = Tri.NO;
      }
    }
  }
}
function unrenderTiles() {
  while (tileGroup.firstChild) {
    tileGroup.removeChild(tileGroup.lastChild);
  }
}
function renderTiles() {
  for (var column of tileData) {
    for (var tile of column) {
      renderTile(tile);
    }
  }
  //TODO: maybe actually calculate this
  let width = tileCols * tileScale * .775;
  let height = tileRows * tileScale * .905;
  tileBase.setAttribute("width", width);
  tileBase.setAttribute("height", height);
  svgElement.setAttribute("width", width);
  svgElement.setAttribute("height", height);
  svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
  updateScale();
}
const sq3 = Math.sqrt(3);
const sideDistanceFromCenter = Math.sin(Math.PI / 3) * 100;
const inFactor = 50
const inDistanceFromCenter = [
  0,
  //sideDistanceFromCenter - Math.tan(Math.PI / 6) * 50,
  inFactor/ Math.sin(Math.PI / 3),
  //(5+20) / Math.sin(Math.PI / 6)//same negative space between opposing pairs
  //25 / Math.cos(Math.PI / 6)//same center length
  //(inFactor / Math.tan(Math.PI / 3)) / Math.cos(Math.PI / 6)//same center length
  0
];

/**
 * 
 * @param {SVGGElement} group 
 * @param {TileData} tile
 */
function addTileBackground(group, tile) {
  var bg = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  var points = [];
  for (var r = Math.PI / 6; r < Math.PI * 2; r += Math.PI / 3) {
    points.push({
      x: Math.sin(r) * 100,
      y: Math.cos(r) * 100
    });
  }
  bg.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(" "));
  bg.setAttribute('class', 'tileBackground');
  if (tile.forced) {
    bg.classList.add("forced");
  }
  group.appendChild(bg);
}

function renderCap(group, linkIndex) {
  let lineWidth = 40;
  var cap = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  //Option 1: tip to center
  var tipY = -30 / Math.cos(Math.PI / 6);
  var points = [
    { x: lineWidth / 2, y: -sideDistanceFromCenter },
    { x: lineWidth / 2, y: tipY - lineWidth / 2 / Math.tan(Math.PI/3) },
    { x: 0, y: tipY },
    { x: -lineWidth / 2, y: tipY - lineWidth / 2 / Math.tan(Math.PI/3) },
    { x: -lineWidth / 2, y: -sideDistanceFromCenter }
  ];
  /*//Option 2: short sides
  var sideExtraDistance = 20 * Math.tan(Math.PI / 6);
  var tipExtraDistance = 20 / Math.tan(Math.PI / 3);
  var tipY = -30 / Math.cos(Math.PI / 6);
  var points = [
    { x: lineWidth / 2, y: -sideDistanceFromCenter },
    { x: lineWidth / 2, y: -inDistanceFromCenter[1] - sideExtraDistance },
    { x: 0, y: -inDistanceFromCenter[1] },
    { x: -lineWidth / 2, y: -inDistanceFromCenter[1] - sideExtraDistance },
    { x: -lineWidth / 2, y: -sideDistanceFromCenter }
  ];
  */
  cap.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(" "));
  cap.setAttribute("class", "cap");
  cap.setAttribute("transform", `rotate(${60 * linkIndex})`);
  group.appendChild(cap);
}

/**
 * 
 * @param {TileData} tile 
 */
function renderTile(tile) {
  var x = tile.x * 150 + 100;
  var y = sq3 / 2 * (tile.y * 2 + 1) * 100;
  if (tile.x % 2 == 1) {
    y += sq3 / 2 * 100;
  }
  var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute('transform', `translate(${x},${y})`);
  group.setAttribute('class', 'truchetTile');
  group.setAttribute('data-column', tile.x);
  group.setAttribute('data-row', tile.y);
  addTileBackground(group, tile);
  //identify all YES links
  var yesLinks = [];
  for (var i = 0; i < tile.links.length; i++) {
    if (tile.links[i] == Tri.YES) {
      yesLinks.push(i);
    }
  }
  //shuffle the links
  shuffle(yesLinks);
  //link pairs of links
  for (var i = 0; i < yesLinks.length; i += 2) {
    if (i == yesLinks.length - 1) {
      //odd number of links
      console.warn(`odd number (${yesLinks.length}) of links in tile ${tile.x},${tile.y}`);
      renderCap(group, yesLinks[i]);
    } else {
      let ia = yesLinks[i];
      let ib = yesLinks[i + 1];
      group.appendChild(getTruchetPolyline(ia, ib, 0, "truchetOutline"));
      group.appendChild(getTruchetPolyline(ia, ib, 1, "truchetLine"));
    }
  }

  /*
      var polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  var points = [];
  for (var li = 0; li < tile.links.length; li++) {
    if (tile.links[li] == Tri.YES) {
      points.push({
        x: Math.sin(Math.PI * li / 3) * sideDistanceFromCenter,
        y: Math.cos(Math.PI * (li + 3) / 3) * sideDistanceFromCenter,
      })
    }
  }
  polygon.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(" "));
  group.appendChild(polygon);
  */
  tileGroup.appendChild(group);
}

/**
 * 
 * @param {integer} ia 
 * @param {integer} ib 
 * @param {number} overlap 
 * @param {string} className 
 * @returns 
 */
function getTruchetPolyline(ia, ib, overlap, className) {

      var points = [];
      points.push({
        x: Math.sin(Math.PI * ia / 3) * (sideDistanceFromCenter + overlap),
        y: Math.cos(Math.PI * (ia + 3) / 3) * (sideDistanceFromCenter + overlap),
      });
      var skips = Math.abs(ib - ia);
      if (skips > 3) {
        skips = 6 - skips;
      }
      if (skips < 3) {
        points.push({
          x: Math.sin(Math.PI * ia / 3) * inDistanceFromCenter[skips],
          y: Math.cos(Math.PI * (ia + 3) / 3) * inDistanceFromCenter[skips],
        });
        points.push({
          x: Math.sin(Math.PI * ib / 3) * inDistanceFromCenter[skips],
          y: Math.cos(Math.PI * (ib + 3) / 3) * inDistanceFromCenter[skips],
        });
      }
      points.push({
        x: Math.sin(Math.PI * ib / 3) * (sideDistanceFromCenter + overlap),
        y: Math.cos(Math.PI * (ib + 3) / 3) * (sideDistanceFromCenter + overlap),
      });
      var polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      polyline.setAttribute('points', points.map(p => `${p.x},${p.y}`).join(" "));
  polyline.setAttribute('class', className);
  return polyline;
}

/**
 * inplace shuffle array
 * @param {Array} a 
 */
function shuffle(a) {
  for (var i = a.length - 1; i >= 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    if (j != i) {
      var temp = a[i];
      a[i] = a[j];
      a[j] = temp;
    }
  }
}

function addTiles() {
  var sq3 = Math.sqrt(3);
  var tiles = ["#t333", "#t3e3", "#taea"];
  for (var xi = 0; xi < 10; xi++) {
    for (var yi = 0; yi < 10; yi++) {
      var x = xi * 150 + 100;
      var y = sq3 / 2 * (yi * 2 + 1) * 100;
      if (xi % 2 == 1) {
        y += sq3 / 2 * 100;
      }
      let tile = tiles[Math.floor(Math.random() * tiles.length)];
      let rotation = Math.floor(Math.random() * 6) * 60;
      var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute('href', tile);
      use.setAttribute('transform', `translate(${x},${y}) rotate(${rotation})`);
      tileGroup.appendChild(use);
    }
  }
}

document.addEventListener("click", handleClick);
function handleClick(event) {
  var targetTileGroup = event.target;
  while (targetTileGroup != null && targetTileGroup.getAttribute('class') != 'truchetTile') {
    targetTileGroup = targetTileGroup.parentElement;
  }
  if (targetTileGroup == null) {
    console.log("didn't resolve to tile", event);
  } else {
    let x = targetTileGroup.getAttribute("data-column");
    let y = targetTileGroup.getAttribute("data-row");
    let tile = tileData[x][y];
    if (tile.forced) {
      tile.forced = false;
    } else {
      for (var i = 0; i < tile.links.length; i++) {
        tile.links[i] = Tri.NO;
      }
      tile.forced = true;
    }
    refresh();
  }
}

function refresh() {
    resetTileData();
    unrenderTiles();
    resolveTiles();
    renderTiles();
}

function reset() {
    resetTileData(true);
    unrenderTiles();
    resolveTiles();
    renderTiles();
}

/**
 * 
 * @param {InputEvent} event 
 */
function inputUpdate(event) {
  tileCols = parseInt(inCols.value);
  tileRows = parseInt(inRows.value);
  while (tileData.length > tileCols) {
    tileData.pop();
  }
  for (var x = 0; x < tileData.length; x++) {
    var oddColumn = ((x % 2) == 1);
    while (tileData[x].length > tileRows) {
      tileData[x].pop();
    }
    for (var y = tileData[x].length; y < tileRows; y++) {
      tileData[x].push(createTile(x, y, [
        Tri.NO,
        oddColumn ? Tri.YES : Tri.NO,
        oddColumn ? Tri.NO : Tri.YES,
        Tri.NO,
        oddColumn ? Tri.NO : Tri.YES,
        oddColumn ? Tri.YES : Tri.NO
      ]));
    }
  }
  for (var x = tileData.length; x < tileCols; x++){
    tileData.push([]);
    for (var y = 0; y < tileRows; y++){
      tileData[x].push(
        createTile(x, y, [Tri.YES, Tri.NO, Tri.NO, Tri.YES, Tri.NO, Tri.NO]));
    }
  }

  unrenderTiles();
  renderTiles();
}

function updateScale() {
  tileScale = parseInt(inScale.value);
  var groupScale = tileScale / 200;
  tileGroup.setAttribute("transform", `scale(${groupScale})`);
}

//https://stackoverflow.com/a/18197341
function save() {
  var svgText = svgElement.outerHTML;
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(svgText));
  element.setAttribute('download', "truchet.svg");

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}