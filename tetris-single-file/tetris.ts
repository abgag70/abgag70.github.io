

const COLS:number = 10;
const ROWS = 20;
const CELL = 30;          // pixel size of each square
const DROP_MS = 500;      // initial drop speed in ms

type Matrix = number[][];
interface PieceSpec { shape: Matrix; color: string; }
interface ActivePiece { spec: PieceSpec; x: number; y: number; }

const PIECES: PieceSpec[] = [
  { shape: [[1, 1, 1, 1]],                         color: '#00f0f0' }, // I
  { shape: [[2, 0, 0], [2, 2, 2]],                 color: '#0000f0' }, // J
  { shape: [[0, 0, 3], [3, 3, 3]],                 color: '#f0a000' }, // L
  { shape: [[4, 4], [4, 4]],                       color: '#f0f000' }, // O
  { shape: [[0, 5, 5], [5, 5, 0]],                 color: '#00f000' }, // S
  { shape: [[0, 6, 0], [6, 6, 6]],                 color: '#a000f0' }, // T
  { shape: [[7, 7, 0], [0, 7, 7]],                 color: '#f00000' }  // Z
];

class Tetris {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private board: Matrix = [];
  private current!: ActivePiece;
  private score = 0;
  private dropTimer = 0;
  private dropDelay = DROP_MS;
  private lastTime = 0;
  private running = true;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D context not available');
    this.ctx = context;
    this.resetBoard();
    this.spawnPiece();
    this.bindKeys();
    requestAnimationFrame(this.loop);
  }

  private resetBoard() {
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  private randomPiece(): PieceSpec {
    return PIECES[(Math.random() * PIECES.length) | 0];
  }

  private spawnPiece() {
    this.current = { spec: this.randomPiece(), x: (COLS / 2 | 0) - 1, y: 0 };
    if (this.collide(this.current.spec.shape, this.current.x, this.current.y)) {
      this.running = false; // Game over
    }
  }

  private rotate(mat: Matrix): Matrix {
    // clockwise rotation
    return mat[0].map((_, i) => mat.map(row => row[i]).reverse());
  }

  private collide(shape: Matrix, offX: number, offY: number): boolean {
    for (let y = 0; y < shape.length; ++y) {
      for (let x = 0; x < shape[y].length; ++x) {
        if (shape[y][x] !== 0 &&
            (this.board[y + offY]?.[x + offX] ?? 1) !== 0) {
          return true;
        }
      }
    }
    return false;
  }

  private merge() {
    const { shape } = this.current.spec;
    for (let y = 0; y < shape.length; ++y)
      for (let x = 0; x < shape[y].length; ++x)
        if (shape[y][x])
          this.board[y + this.current.y][x + this.current.x] = shape[y][x];
  }

  private clearLines() {
    outer: for (let y = ROWS - 1; y >= 0; --y) {
      for (let x = 0; x < COLS; ++x)
        if (this.board[y][x] === 0) continue outer;
      // row full
      this.board.splice(y, 1);
      this.board.unshift(Array(COLS).fill(0));
      this.score += 100;
      ++y; // re‑check same y after shifting
    }
  }

  private move(dx: number) {
    if (!this.running) return;
    const { shape } = this.current.spec;
    const newX = this.current.x + dx;
    if (!this.collide(shape, newX, this.current.y))
      this.current.x = newX;
  }

  private drop() {
    if (!this.running) return;
    ++this.current.y;
    if (this.collide(this.current.spec.shape, this.current.x, this.current.y)) {
      --this.current.y;
      this.merge();
      this.clearLines();
      this.spawnPiece();
    }
    this.dropTimer = 0;
  }

  private hardDrop() {
    if (!this.running) return;
    while (!this.collide(this.current.spec.shape, this.current.x, this.current.y + 1))
      ++this.current.y;
    this.merge();
    this.clearLines();
    this.spawnPiece();
  }

  private rotateCurrent() {
    if (!this.running) return;
    const rotated = this.rotate(this.current.spec.shape);
    if (!this.collide(rotated, this.current.x, this.current.y))
      this.current.spec.shape = rotated;
  }

  private bindKeys() {
    window.addEventListener('keydown', e => {
      switch (e.key) {
        case 'ArrowLeft': this.move(-1); break;
        case 'ArrowRight': this.move(1); break;
        case 'ArrowDown': this.drop(); break;
        case 'ArrowUp': this.rotateCurrent(); break;
        case ' ': this.hardDrop(); break;
      }
    });
  }

  private drawCell(x: number, y: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
  }

  private drawBoard() {
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < ROWS; ++y)
      for (let x = 0; x < COLS; ++x)
        if (this.board[y][x])
          this.drawCell(x, y, PIECES[this.board[y][x]-1].color);

    // active piece
    const { shape, color } = this.current.spec;
    for (let y = 0; y < shape.length; ++y)
      for (let x = 0; x < shape[y].length; ++x)
        if (shape[y][x])
          this.drawCell(this.current.x + x, this.current.y + y, color);
  }

  private loop = (time: number) => {
    const delta = time - this.lastTime;
    this.lastTime = time;
    this.dropTimer += delta;
    if (this.dropTimer > this.dropDelay) this.drop();
    this.drawBoard();
    this.drawInfo();
    requestAnimationFrame(this.loop);
  };

  private drawInfo() {
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px monospace';
    this.ctx.fillText(`Score: ${this.score}`, 4, 18);
    if (!this.running) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
      this.ctx.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);
      this.ctx.fillStyle = '#fff';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.textAlign = 'start';
    }
  }
}

/* Bootstrap when document is ready */
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('tetris') as HTMLCanvasElement;
  new Tetris(canvas);
});
