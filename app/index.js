import document from "document";
import clock from "clock";
import { display } from "display";

// Ekranın oyun sırasında kapanmasını engelle
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

// --- AYARLAR ---
const COLS = 10;
const ROWS = 12;

let board = [];
// Tahtayı sıfırla
for (let r = 0; r < ROWS; r++) {
  let row = [];
  for (let c = 0; c < COLS; c++) {
    row.push(0);
  }
  board.push(row);
}

let score = 0;
let gameLoop = null;

// Şekiller (Düzgün Format)
const SHAPES = [
  [ [1, 1, 1, 1] ],                  // I
  [ [1, 0, 0], [1, 1, 1] ],          // J
  [ [0, 0, 1], [1, 1, 1] ],          // L
  [ [1, 1], [1, 1] ],                // O
  [ [0, 1, 1], [1, 1, 0] ],          // S
  [ [0, 1, 0], [1, 1, 1] ],          // T
  [ [1, 1, 0], [0, 1, 1] ]           // Z
];

let curPiece = null;
let curPos = { x: 3, y: 0 };

const scoreEl = document.getElementById("score-text");

// Blok Havuzunu Yükle (120 Adet)
const blocks = [];
for (let i = 0; i < 120; i++) {
  let b = document.getElementById(`b${i}`);
  if (b) blocks.push(b);
}

// --- KONTROLLER ---
const safeClick = (id, fn) => {
  const el = document.getElementById(id);
  if (el) el.onclick = fn;
};

safeClick("left", () => move(-1));
safeClick("right", () => move(1));
safeClick("rotate", () => rotate());
safeClick("down", () => drop());

// --- OYUN MANTIĞI ---

function newPiece() {
  const r = Math.floor(Math.random() * SHAPES.length);
  const shape = SHAPES[r];
  
  curPiece = shape;
  curPos = { x: Math.floor((COLS - shape[0].length) / 2), y: 0 };
  
  if (collide()) {
    endGame();
  }
  draw();
}

function collide(p, pos) {
  const piece = p || curPiece;
  const position = pos || curPos;
  
  if (!piece) return false;

  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      if (piece[y][x]) {
        let nY = y + position.y;
        let nX = x + position.x;
        
        if (nX < 0 || nX >= COLS || nY >= ROWS) return true;
        if (nY >= 0 && board[nY][nX]) return true;
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
  if (!curPiece) return;
  
  // Matris döndürme
  const rotated = curPiece[0].map((_, index) => 
    curPiece.map(row => row[index]).reverse()
  );
  
  const oldPiece = curPiece;
  curPiece = rotated;
  
  if (collide()) {
    curPiece = oldPiece; // Çarpıyorsa iptal et
  }
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
      if (val) {
        let boardY = y + curPos.y;
        let boardX = x + curPos.x;
        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS
