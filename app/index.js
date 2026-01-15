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
const BLOCK_SIZE = 18;

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let score = 0;
let gameLoop = null;

const SHAPES = [
  [[1, 1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], 
  [[1, 1], [1, 1]], [[0, 1, 1], [1, 1, 0]], [[0, 1, 0], [1, 1, 1]], [[1, 1, 0], [0, 1, 1]]
