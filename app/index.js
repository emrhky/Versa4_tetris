import document from "document";
import clock from "clock";

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

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let score = 0;
let gameLoop = null;

// HATA ÇÖZÜMÜ: Şekiller alt alta ve net bir yapıda tanımlandı
const SHAPES = [
  [ [1, 1, 1, 1] ],                  // I Parçası
  [ [1, 0, 0], [1, 1, 1] ],          // J Parçası
  [ [0, 0, 1], [1, 1, 1] ],          // L Parçası
  [ [1, 1], [1, 1] ],                // O Parçası
  [ [0, 1, 1], [1, 1, 0] ],          // S Parçası
  [ [0, 1, 0], [1, 1, 1] ],          // T Parçası
  [ [1, 1, 0], [0, 1, 1] ]           // Z Parçası
];

let curPiece = null;
let curPos = { x: 3, y: 0 };

const scoreEl = document.getElementById("score-text");

// Blokları Yükle
const blocks = [];
for (let i = 0; i < 120; i++) {
  try {
    let b = document.getElementById(`b${i}`);
    if (b) blocks.push(b);
  } catch(e) {}
}

// --- KONTROLLER ---
const safeClick = (id, fn) => { 
  let el = document.getElementById(id); 
  if(el) el.onclick = fn; 
};

safeClick("left", () => move(-1));
safeClick("right", () => move(1));
safeClick("rotate", () => rotate());
safeClick("down", () => drop());

// --- OYUN MANTIĞI ---
function newPiece() {
  // Rastgele parça seç
  const r = Math.floor(Math.random() * SHAPES.length);
  const shape = SHAPES[r];
  
  curPiece = shape;
  curPos = { x: Math.floor((COLS - shape[0].length) / 2), y: 0 };
  
  if (collide()) {
    endGame(); // Başlar başlamaz çarpıyorsa oyun biter
  }
  draw();
}

function collide(p = curPiece, pos = curPos) {
  if (!p) return false;
  for (let y = 0; y < p.length; y++) {
    for (let x = 0; x < p[y].length; x++) {
      if (p[y][x]) {
        let nY = y + pos.y;
        let nX = x + pos.x;
        
        // Sınır Kontrolü
        if (nX < 0 || nX >= COLS || nY >= ROWS) return true;
        
        // Dolu Alan Kontrolü
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
  if(!curPiece) return;
  
  // Matris Döndürme İşlemi
  const rotated = curPiece[0].map((_, i) => curPiece.map(row => row[i]).reverse());
  const old = curPiece;
  
  curPiece = rotated;
  if (collide()) curPiece = old; // Çarpıyorsa geri al
  draw();
}

function drop() {
  curPos.y++;
  if (collide()) {
    curPos.y--; // Bir yukarı al
    merge();    // Tahtaya sabitle
    clearLines(); // Satır sil
    newPiece();   // Yeni parça
  }
  draw();
}

function merge() {
  curPiece.forEach((row, y) => {
    row.forEach((val, x) => {
      if (val && (y + curPos.y) >= 0) {
        board[y + curPos.y][x + curPos.x] = 1;
      }
    });
  });
}

function clearLines() {
  let lines = 0;
  board = board.filter(row => {
    if (row.every(v => v !== 0)) { 
      lines++; 
      return false; // Bu satırı sil (yeni board'a ekleme)
    }
    return true;
  });
  
  // Silinen kadar üstten boş satır ekle
  while (board.length < ROWS) {
    board.unshift(Array(COLS).fill(0));
  }
  
  if (lines > 0) {
    score += lines * 10;
    if (scoreEl) scoreEl.text = "SKOR: " + score;
  }
}

function draw() {
  // Önce tüm blokları gizle
  blocks.forEach(b => { 
    if(b) b.style.display = "none"; 
  });
  
  let bIdx = 0;

  // 1. Sabitlenmiş blokları çiz
  for(let y=0; y<ROWS; y++) {
    for(let x=0; x<COLS; x++) {
      if(board[y][x] === 1) {
        if (bIdx < blocks.length) {
          let b = blocks[bIdx];
          b.x = x * 18; // BLOCK_SIZE manuel yazıldı
          b.y = y * 18;
          b.style.display = "inline";
          bIdx++;
        }
      }
    }
  }

  // 2. Hareketli parçayı çiz
  if (curPiece) {
    curPiece.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val) {
          if (bIdx < blocks.length) {
            let b = blocks[bIdx];
            b.x = (x + curPos.x) * 18;
            b.y = (y + curPos.y) * 18;
            b.style.display = "inline";
            bIdx++;
          }
        }
      });
    });
  }
}

function endGame() {
  if (gameLoop) { clearInterval(gameLoop); gameLoop = null; }
  
  // 2 Saniye sonra yeniden başlat
  setTimeout(() => {
    resetGame();
  }, 2000);
}

function resetGame() {
  // Tahtayı Temizle
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  score = 0;
  if (scoreEl) scoreEl.text = "SKOR: 0";
  
  newPiece();
  
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(drop, 1000); // 1 saniy
