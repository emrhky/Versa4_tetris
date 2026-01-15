import document from "document";
import clock from "clock";
import { display } from "display";

display.autoOff = false;

// --- SAAT ---
const clockLabel = document.getElementById("clock-label");
function refreshClock() {
  let today = new Date();
  let timeStr = ("0" + today.getHours()).slice(-2) + ":" + ("0" + today.getMinutes()).slice(-2);
  if (clockLabel) clockLabel.text = timeStr;
}
clock.granularity = "minutes";
clock.ontick = () => refreshClock();
refreshClock();

// --- AYARLAR ---
const COLS = 10;
const ROWS = 12;
const BLOCK_SIZE = 18; // XML'deki blok boyutu ile uyumlu olmalı

let board = [];
for (let r = 0; r < ROWS; r++) {
  board[r] = new Array(COLS).fill(0);
}

let score = 0;
let gameLoop = null;

const SHAPES = [
  [[1,1,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
  [[1,1],[1,1]],
  [[0,1,1],[1,1,0]],
  [[0,1,0],[1,1,1]],
  [[1,1,0],[0,1,1]]
];

let curPiece = null;
let curPos = { x: 3, y: 0 };
const scoreEl = document.getElementById("score-text");

// BLOK HAVUZU (Sadece var olanları al)
const blocks = [];
for (let i = 0; i < 120; i++) {
  let b = document.getElementById(`b${i}`);
  if (b) blocks.push(b);
}
const blocksLen = blocks.length;

// --- KONTROLLER ---
const safeClick = (id, fn) => {
  let el = document.getElementById(id);
  if (el) el.onclick = fn;
};

safeClick("left", () => move(-1));
safeClick("right", () => move(1));
safeClick("rotate", () => rotate());
safeClick("down", () => drop());

// --- OYUN MANTIĞI ---
function newPiece() {
  const r = Math.floor(Math.random() * SHAPES.length);
  curPiece = SHAPES[r];
  curPos.x = Math.floor((COLS - curPiece[0].length) / 2);
  curPos.y = 0;

  if (collide(curPiece, curPos)) {
    endGame();
    return;
  }
  draw();
}

function collide(piece, pos) {
  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (piece[y][x] !== 0) {
        let nY = pos.y + y;
        let nX = pos.x + x;
        if (nX < 0 || nX >= COLS || nY >= ROWS) return true;
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

function rotate() {
  if (!curPiece) return;
  // Manuel Matris Döndürme (Map kullanmadan)
  let newPiece = [];
  for (let x = 0; x < curPiece[0].length; x++) {
    newPiece[x] = [];
    for (let y = curPiece.length - 1; y >= 0; y--) {
      newPiece[x].push(curPiece[y][x]);
    }
  }
  
  let oldPiece = curPiece;
  curPiece = newPiece;
  if (collide(curPiece, curPos)) {
    curPiece = oldPiece;
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
  for (let y = 0; y < curPiece.length; y++) {
    for (let x = 0; x < curPiece[y].length; x++) {
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

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    let isFull = true;
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === 0) {
        isFull = false;
        break;
      }
    }
    if (isFull) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++; // Aynı satırı tekrar kontrol et
    }
  }
  if (cleared > 0) {
    score += cleared * 10;
    if (scoreEl) scoreEl.text = "SKOR: " + score;
  }
}

// --- OPTİMİZE ÇİZİM (Reset atmasını önleyen kısım) ---
function draw() {
  // Bellek dostu döngü
  for (let i = 0; i < blocksLen; i++) {
    blocks[i].style.display = "none";
  }

  let i = 0;
  // Sabit Bloklar
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] !== 0 && i < blocksLen) {
        blocks[i].x = x * 18; // Sabit BLOCK_SIZE
        blocks[i].y = y * 18;
        blocks[i].style.display = "inline";
        i++;
      }
    }
  }

  // Hareketli Parça
  if (curPiece) {
    for (let y = 0; y < curPiece.length; y++) {
      for (let x = 0; x < curPiece[y].length; x++) {
        if (curPiece[y][x] !== 0 && i < blocksLen) {
          blocks[i].x = (curPos.x + x) * 18;
          blocks[i].y = (curPos.y + y) * 18;
          blocks[i].style.display = "inline";
          i++;
        }
      }
    }
  }
}

function endGame() {
  clearInterval(gameLoop);
  setTimeout(() => {
    // Tahtayı temizle ve yeniden başlat
    for (let r = 0; r < ROWS; r++) board[r].fill(0);
    score = 0;
    if (scoreEl) scoreEl.text = "SKOR: 0";
    resetGame();
  }, 2000);
}

function resetGame() {
  newPiece();
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(() => drop(), 700);
}

// BAŞLAT
resetGame();
