import document from "document";
import clock from "clock";
import * as fs from "fs";

const COLS = 10;
const ROWS = 12;
const BLOCK_SIZE = 18;
const HIGH_SCORE_FILE = "highscore_tetris.json";

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let score = 0;
let highScore = 0;
let highScoreDate = "";
let gameLoop = null;

// Şekiller: I, J, L, O, S, T, Z
const SHAPES = [
  [[1, 1, 1, 1]], 
  [[1, 0, 0], [1, 1, 1]], 
  [[0, 0, 1], [1, 1, 1]], 
  [[1, 1], [1, 1]], 
  [[0, 1, 1], [1, 1, 0]], 
  [[0, 1, 0], [1, 1, 1]], 
  [[1, 1, 0], [0, 1, 1]]
];

let curPiece = null;
let curPos = { x: 3, y: 0 };

// UI Elemanları
const clockLabel = document.getElementById("clock-label");
const menuClock = document.getElementById("menu-clock");
const scoreEl = document.getElementById("score-text");
const menuContainer = document.getElementById("menu-container");
const highScoreText = document.getElementById("high-score-text");
const lastScoreText = document.getElementById("last-score-text");
const btnStart = document.getElementById("btn-start");
const btnText = document.getElementById("btn-text");

// Blok Havuzunu Yükle
const blocks = [];
for (let i = 0; i < 120; i++) {
  blocks.push(document.getElementById(`b${i}`));
}

// Kayıtlı Skoru Yükle
try {
  if (fs.existsSync(HIGH_SCORE_FILE)) {
    const data = fs.readFileSync(HIGH_SCORE_FILE, "json");
    highScore = data.score || 0;
    highScoreDate = data.date || "";
  }
} catch (e) {}

function updateHighScoreDisplay() {
  highScoreText.text = `EN YÜKSEK: ${highScore} ${highScoreDate ? "(" + highScoreDate + ")" : ""}`;
}
updateHighScoreDisplay();

clock.granularity = "minutes";
clock.ontick = (evt) => {
  let timeStr = ("0" + evt.date.getHours()).slice(-2) + ":" + ("0" + evt.date.getMinutes()).slice(-2);
  clockLabel.text = timeStr;
  menuClock.text = timeStr;
};

// Kontroller
document.getElementById("left").onclick = () => move(-1);
document.getElementById("right").onclick = () => move(1);
document.getElementById("rotate").onclick = () => rotate();
document.getElementById("down").onclick = () => drop();
btnStart.onclick = () => resetGame();

function newPiece() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  curPiece = shape;
  curPos = { x: Math.floor((COLS - shape[0].length) / 2), y: 0 };
  if (collide()) endGame();
}

function collide(p = curPiece, pos = curPos) {
  for (let y = 0; y < p.length; y++) {
    for (let x = 0; x < p[y].length; x++) {
      if (p[y][x] && (board[y + pos.y] === undefined || board[y + pos.y][x + pos.x] === undefined || board[y + pos.y][x + pos.x])) return true;
    }
  }
  return false;
}

function move(dir) {
  curPos.x += dir;
  if (collide()) curPos.x -= dir;
  draw();
}

function rotate() {
  const rotated = curPiece[0].map((_, i) => curPiece.map(row => row[i]).reverse());
  const oldPiece = curPiece;
  curPiece = rotated;
  if (collide()) curPiece = oldPiece;
  draw();
}

function drop() {
  curPos.y++;
  if (collide()) {
    curPos.y--;
    merge();
    clearLines();
    newPiece();
  }
  draw();
}

function merge() {
  curPiece.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) board[y + curPos.y][x + curPos.x] = 1;
    });
  });
}

function clearLines() {
  let lines = 0;
  board = board.filter(row => {
    if (row.every(v => v)) {
      lines++;
      return false;
    }
    return true;
  });
  while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
  if (lines > 0) {
    score += lines * 10;
    scoreEl.text = "SKOR: " + score;
  }
}

function draw() {
  blocks.forEach(b => b.style.display = "none");
  let bIdx = 0;

  // Tahtadaki bloklar
  board.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val && bIdx < 120) {
        blocks[bIdx].x = x * BLOCK_SIZE;
        blocks[bIdx].y = y * BLOCK_SIZE;
        blocks[bIdx].style.display = "inline";
        bIdx++;
      }
    });
  });

  // Hareketli parça
  curPiece.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val && bIdx < 120) {
        blocks[bIdx].x = (x + curPos.x) * BLOCK_SIZE;
        blocks[bIdx].y = (y + curPos.y) * BLOCK_SIZE;
        blocks[bIdx].style.display = "inline";
        bIdx++;
      }
    });
  });
}

function endGame() {
  clearInterval(gameLoop);
  if (score > highScore) {
    highScore = score;
    const now = new Date();
    highScoreDate = ("0" + now.getDate()).slice(-2) + "/" + ("0" + (now.getMonth() + 1)).slice(-2) + "/" + now.getFullYear();
    fs.writeFileSync(HIGH_SCORE_FILE, { score: highScore, date: highScoreDate }, "json");
  }
  updateHighScoreDisplay();
  lastScoreText.text = "SKORUN: " + score;
  lastScoreText.style.display = "inline";
  btnText.text = "YENİDEN DENE";
  menuContainer.style.display = "inline";
}

function resetGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  score = 0;
  scoreEl.text = "SKOR: 0";
  menuContainer.style.display = "none";
  newPiece();
  gameLoop = setInterval(drop, 1000); // 1 saniyede bir düşer
}

newPiece();
draw();
