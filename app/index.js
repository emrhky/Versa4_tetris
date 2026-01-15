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

// --- AYARLAR ---
const COLS = 10;
const ROWS = 12;

// Tahtayı oluştur
let board = [];
for (let r = 0; r < ROWS; r++) {
  let row = [];
  for (let c = 0; c < COLS; c++) {
    row.push(0);
  }
  board.push(row);
}

let score = 0;
let gameLoop = null;

// Şekiller
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

// Blok Havuzunu Yükle
const blocks = [];
for (let i = 0; i < 120; i++) {
  let b = document.getElementById(`b${i}`);
  if (b) blocks.push(b);
}

// --- KONTROLLER ---
function safeClick(id, fn) {
  const el = document.getElementById(id);
  if (el) el.onclick = fn;
}

safeClick("left", function() { move(-1); });
safeClick("right", function() { move(1); });
safeClick("rotate", function() { rotate(); });
safeClick("down", function() { drop(); });

// --- OYUN MANTIĞI ---

function newPiece() {
  const r = Math.floor(Math.random() * SHAPES.length);
  const shape = SHAPES[r];
  
  curPiece = shape;
  curPos = { x: Math.floor((COLS - shape[0].length) / 2), y: 0 };
  
  if (collide(curPiece, curPos)) {
    endGame();
  }
  draw();
}

function collide(p, pos) {
  // Parametre gelmezse mevcut durumu kullan
  const piece = p || curPiece;
  const position = pos || curPos;
  
  if (!piece) return false;

  for (let y = 0; y < piece.length; y++) {
    for (let x = 0; x < piece[y].length; x++) {
      // Eğer blok doluysa (1 ise)
      if (piece[y][x] !== 0) {
        let nY = y + position.y;
        let nX = x + position.x;
        
        // Sınır kontrolü
        if (nX < 0 || nX >= COLS || nY >= ROWS) return true;
        // Çarpışma kontrolü
        if (nY >= 0 && board[nY][nX] !== 0) return true;
      }
    }
  }
  return false;
}

function move(dir) {
  curPos.x += dir;
  if (collide(curPiece, curPos)) {
    curPos.x -= dir; // Geri al
  }
  draw();
}

function rotate() {
  if (!curPiece) return;
  
  // Matris döndürme
  const rotated = curPiece[0].map((val, index) => 
    curPiece.map(row => row[index]).reverse()
  );
  
  const oldPiece = curPiece;
  curPiece = rotated;
  
  if (collide(curPiece, curPos)) {
    curPiece = oldPiece; // Çarpıyorsa iptal et
  }
  draw();
}

function drop() {
  curPos.y++;
  if (collide(curPiece, curPos)) {
    curPos.y--; // Bir yukarı al
    merge();
    clearLines();
    newPiece();
  }
  draw();
}

function merge() {
  for(let y=0; y < curPiece.length; y++) {
    for(let x=0; x < curPiece[y].length; x++) {
      if (curPiece[y][x] !== 0) {
        let boardY = y + curPos.y;
        let boardX = x + curPos.x;
        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
          board[boardY][boardX] = 1;
        }
      }
    }
  }
}

// [DÜZELTME] Hataya sebep olan fonksiyon tamamen basitleştirildi
function clearLines() {
  let linesCleared = 0;
  let nextBoard = [];

  // 1. Dolu olmayan satırları bul ve yeni tahtaya ekle
  for (let r = 0; r < ROWS; r++) {
    let isFull = true;
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === 0) {
        isFull = false;
        break;
      }
    }
    
    // Eğer satır tamamen dolu DEĞİLSE, onu koru
    if (!isFull) {
      nextBoard.push(board[r]);
    } else {
      linesCleared++;
    }
  }

  // 2. Eksik kalan kısımları üstten boş satırla doldur
  while (nextBoard.length < ROWS) {
    let emptyRow = [];
    for(let c=0; c<COLS; c++) {
      emptyRow.push(0);
    }
    nextBoard.unshift(emptyRow); // En başa ekle
  }

  // 3. Tahtayı güncelle
  board = nextBoard;
  
  if (linesCleared > 0) {
    score += linesCleared * 10;
    if (scoreEl) scoreEl.text = "SKOR: " + score;
  }
}

function draw() {
  // Önce tüm blokları gizle
  for(let i=0; i<blocks.length; i++) {
    if(blocks[i]) blocks[i].style.display = "none";
  }
  
  let bIdx = 0;

  // 1. Sabit Tahtayı Çiz
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] !== 0) {
        if (bIdx < blocks.length) {
          let b = blocks[bIdx];
          b.x = x * 18;
          b.y = y * 18;
          b.style.display = "inline";
          bIdx++;
        }
      }
    }
  }

  // 2. Hareketli Parçayı Çiz
  if (curPiece) {
    for (let y = 0; y < curPiece.length
