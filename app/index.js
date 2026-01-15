import document from "document";
import clock from "clock";
import { display } from "display";

// Ekranın kapanmasını engelle
display.autoOff = false;

// --- SAAT ---
const clockLabel = document.getElementById("clock-label");

function refreshClock() {
  let today = new Date();
  let h = ("0" + today.getHours()).slice(-2);
  let m = ("0" + today.getMinutes()).slice(-2);
  if (clockLabel) clockLabel.text = `${h}:${m}`;
}
clock.granularity = "minutes";
clock.ontick = () => refreshClock();
refreshClock();

// --------------------------------
//       TETRIS AYARLARI
// --------------------------------
const COLS = 10;
const ROWS = 12;

let board = [];
for (let r = 0; r < ROWS; r++) {
  let row = [];
  for (let c = 0; c < COLS; c++) row.push(0);
  board.push(row);
}

let score = 0;
let gameLoop = null;

// Şekiller
const SHAPES = [
  [[1,1,1,1]],                        // I
  [[1,0,0],[1,1,1]],                  // J
  [[0,0,1],[1,1,1]],                  // L
  [[1,1],[1,1]],                      // O
  [[0,1,1],[1,1,0]],                  // S
  [[0,1,0],[1,1,1]],                  // T
  [[1,1,0],[0,1,1]]                   // Z
];

let curPiece = null;
let curPos = { x: 3, y: 0 };

const scoreEl = document.getElementById("score-text");

// BLOK HAVUZU
const blocks = [];
for (let i = 0; i < 200; i++) {
  let b = document.getElementById(`b${i}`);
  if (b) blocks.push(b);
}

// -------------------------------
//         KONTROLLER
// -------------------------------
function safeClick(id, fn) {
  const el = document.getElementById(id);
  if (el) el.onclick = fn;
}

safeClick("left", () => move(-1));
safeClick("right", () => move(1));
safeClick("rotate", () => rotate());
safeClick("down", () => drop());

// -------------------------------
//         OYUN MANTIĞI
// -------------------------------

function newPiece() {
  const r = Math.floor(Math.random() * SHAPES.length);
  curPiece = SHAPES[r];
  curPos = { x: Math.floor((COLS - curPiece[0].length) / 2), y: 0 };

  if (collide(curPiece, curPos)) {
    endGame();
    return;
  }
  draw();
}

function collide(piece, pos) {
  for (let y=0; y<piece.length; y++) {
    for (let x=0; x<piece[y].length; x++) {
      if (piece[y][x] !== 0) {
        let nY = pos.y + y;
        let nX = pos.x + x;

        if (nX < 0 || nX >= COLS) return true;
        if (nY >= ROWS) return true;

        if (nY >= 0 && board[nY][nX] !== 0) return true;
      }
    }
  }
  return false;
}

function move(dir) {
  curPos.x += dir;
  if (collide(curPiece, curPos)) curPos.x -= dir;
  draw();
}

// --- DÜZELTİLMİŞ ROTATE ---
function rotateMatrix(m) {
  return m[0].map((_, i) => m.map(row => row[i]).reverse());
}

function rotate() {
  if (!curPiece) return;

  const rotated = rotateMatrix(curPiece);
  const old = curPiece;

  curPiece = rotated;
  if (collide(curPiece, curPos)) {
    curPiece = old; // Geri al
  }
  draw();
}

function drop() {
  curPos.y++;
  if (collide(curPiece, curPos)) {
    curPos.y--;
    merge();
    clearLines();
    newPiece();
  }
  draw();
}

function merge() {
  for (let y=0; y<curPiece.length; y++) {
    for (let x=0; x<curPiece[y].length; x++) {
      if (curPiece[y][x] !== 0) {
        let by = curPos.y + y;
        let bx = curPos.x + x;

        if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
          board[by][bx] = 1;
        }
      }
    }
  }
}

// --- DÜZELTİLMİŞ SATIR TEMİZLEME ---
function clearLines() {
  let next = [];
  let cleared = 0;

  for (let r = 0; r < ROWS; r++) {
    if (board[r].every(v => v === 1)) {
      cleared++;
    } else {
      next.push(board[r]);
    }
  }

  while (next.length < ROWS) next.unshift(new Array(COLS).fill(0));

  board = next;

  if (cleared > 0) {
    score += cleared * 10;
    scoreEl.text = "SKOR: " + score;
  }
}

// -------------------------------
//            ÇİZİM
// -------------------------------
function draw() {
  for (let b of blocks) b.style.display = "none";

  let i = 0;

  // Sabit bloklar
  for (let y=0; y<ROWS; y++) {
    for (let x=0; x<COLS; x++) {
      if (board[y][x] !== 0 && i < blocks.length) {
        blocks[i].x = x * 16;
        blocks[i].y = y * 16;
        blocks[i].style.display = "inline";
        i++;
      }
    }
  }

  // Hareketli parça
  if (curPiece) {
    for (let y=0; y<curPiece.length; y++) {
      for (let x=0; x<curPiece[y].length; x++) {
        if (curPiece[y][x] !== 0 && i < blocks.length) {
          blocks[i].x = (curPos.x + x) * 16;
          blocks[i].y = (curPos.y + y) * 16;
          blocks[i].style.display = "inline";
          i++;
        }
      }
    }
  }
}

function endGame() {
  console.log("GAME OVER");
  clearInterval(gameLoop);
}

// OYUN BAŞLAT
newPiece();

gameLoop = setInterval(() => drop(), 700);