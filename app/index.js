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

const SHAPES = [
  [[1, 1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], 
  [[1, 1], [1, 1]], [[0, 1, 1], [1, 1, 0]], [[0, 1, 0], [1, 1, 1]], [[1, 1, 0], [0, 1, 1]]
];

let curPiece = null;
let curPos = { x: 3, y: 0 };

const clockLabel = document.getElementById("clock-label");
const menuClock = document.getElementById("menu-clock");
const scoreEl = document.getElementById("score-text");
const menuContainer = document.getElementById("menu-container");
const highScoreText = document.getElementById("high-score-text");
const lastScoreText = document.getElementById("last-score-text");
const btnStart = document.getElementById("btn-start");
const btnText = document.getElementById("btn-text");

// Blok Havuzu (Güvenli Yükleme)
const blocks = [];
for (let i = 0; i < 120; i++) {
  let b = document.getElementById(`b${i}`);
  if (b) blocks.push(b);
}

// SAAT DÜZELTMESİ: Fonksiyonu ayırdım ve anında çağırdım
function refreshClock() {
  let today = new Date();
  let timeStr = ("0" + today.getHours()).slice(-2) + ":" + ("0" + today.getMinutes()).slice(-2);
  if (clockLabel) clockLabel.text = timeStr;
  if (menuClock) menuClock.text = timeStr;
}

clock.granularity = "minutes";
clock.ontick = () => refreshClock();
refreshClock(); // İlk açılışta anında güncelle

// Yüksek Skoru Yükle
try {
  if (fs.existsSync(HIGH_SCORE_FILE)) {
    const data = fs.readFileSync(HIGH_SCORE_FILE, "json");
    highScore = data.score || 0;
    highScoreDate = data.date || "";
  }
} catch (e) {}

function updateHighScoreDisplay() {
  if (highScoreText) highScoreText.text = `EN YÜKSEK: ${highScore} ${highScoreDate ? "(" + highScoreDate + ")" : ""}`;
}
updateHighScoreDisplay();

// Kontroller
document.getElementById("left").onclick = () => move(-1);
document.getElementById("right").onclick = () => move(1);
document.getElementById("rotate").onclick = () => rotate();
document.getElementById("down").onclick = () => drop();
if (btnStart) btnStart.onclick = () => resetGame();

function newPiece() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  curPiece = shape;
  curPos = { x: Math.floor((COLS - shape[0].length) / 2), y: 0 };
  if (collide()) endGame();
  draw();
}

function collide(p = curPiece, pos = curPos) {
  if (!p) return false;
  for (let y = 0; y < p.length; y++) {
    for (let x = 0; x < p[y].length; x++) {
      if (p[y][x]) {
        let nY = y + pos.y;
        let nX = x + pos.x;
        if (nX < 0 || nX >= COLS || nY >= ROWS || (nY >= 0 && board[nY][nX])) return true;
      }
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
  const old = curPiece;
  curPiece = rotated;
  if (collide()) curPiece = old;
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
    row.forEach((val, x) => {
      if (val && (y + curPos.y) >= 0) board[y + curPos.y][x + curPos.x] = 1;
    });
  });
}

function clearLines() {
  let lines = 0;
  board = board.filter(row => {
    if (row.every(v => v)) { lines++; return false; }
    return true;
  });
  while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
  if (lines > 0) {
    score += lines * 10;
    if (scoreEl) scoreEl.text = "SKOR: " + score;
  }
}

function draw() {
  blocks.forEach(b => b.style.display = "none");
  let bIdx = 0;

  board.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val && bIdx < blocks.length) {
        blocks[bIdx].x = x * BLOCK_SIZE;
        blocks[bIdx].y = y * BLOCK_SIZE;
        blocks[bIdx].style.display = "inline";
        bIdx++;
      }
    });
  });

  if (curPiece) {
    curPiece.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val && bIdx < blocks.length) {
          blocks[bIdx].x = (x + curPos.x) * BLOCK_SIZE;
          blocks[bIdx].y = (y + curPos.y) * BLOCK_SIZE;
          blocks[bIdx].style.display = "inline";
          bIdx++;
        }
      });
    });
  }
}

function endGame() {
  if (gameLoop) { clearInterval(gameLoop); gameLoop = null; }
  if (score > highScore) {
    highScore = score;
    const now = new Date();
    highScoreDate = ("0" + now.getDate()).slice(-2) + "/" + ("0" + (now.getMonth() + 1)).slice(-2) + "/" + now.getFullYear();
    try { fs.writeFileSync(HIGH_SCORE_FILE, { score: highScore, date: highScoreDate }, "json"); } catch (e) {}
  }
  updateHighScoreDisplay();
  if (lastScoreText) {
    lastScoreText.text = "SKORUN: " + score;
    lastScoreText.style.display = "inline";
  }
  if (btnText) btnText.text = "YENİDEN DENE";
  if (menuContainer) menuContainer.style.display = "inline";
}

function resetGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  score = 0;
  if (scoreEl) scoreEl.text = "SKOR: 0";
  if (menuContainer) menuContainer.style.display = "none";
  newPiece();
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(drop, 1000);
}

// Başlangıç ekranı çizimi
draw();
