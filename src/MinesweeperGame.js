/* eslint-disable no-underscore-dangle, no-continue */

const Queue = require('./Queue');

class MinesweeperGame {
  constructor(difficulty = 'easy', options) {
    this._numRevealedCells = 0;
    this._difficultySettings = {
      easy: {
        n: 9,
        m: 9,
        b: 10,
      },
      medium: {
        n: 16,
        m: 16,
        b: 40,
      },
      hard: {
        n: 16,
        m: 30,
        b: 99,
      },
    };

    this._cellStateToggleMapping = {
      0: 3,
      1: 4,
      3: 0,
      4: 1,
    };

    if (difficulty === 'custom') {
      const { n, m, b } = options;
      this._setBoardState(n, m, b);
    } else {
      const { n, m, b } = this._difficultySettings[difficulty];
      this._setBoardState(n, m, b);
    }

    this._status = 'in-progress';
    this._grid = this._initializeGrid();
  }

  _setBoardState(n, m, b) {
    this._numRows = n;
    this._numColumns = m;
    this._numBombs = b;
    this._matrix = MinesweeperGame._initializeMatrix(n, m, b);
  }

  static _shuffle(array) {
    for (let i = 0; i < array.length; i++) {
      const r = Math.round(Math.random() * i);
      [array[i], array[r]] = [array[r], array[i]];
    }
    return array;
  }

  static _initializeMatrix(n, m, b) {
    const matrix = [[]];

    if (n * m - b > 0) {
      const emptySquares = new Array(n * m - b).fill(0);
      const bombSquares = new Array(b).fill(1);
      const allSquares = MinesweeperGame._shuffle(
        emptySquares.concat(bombSquares),
      );

      let k = -1;
      for (let i = 0; i < allSquares.length; i++) {
        if (i % m === 0) {
          k++;
          matrix[k] = [];
        }
        matrix[k].push(allSquares[i]);
      }
    }

    return matrix;
  }

  _initializeGrid() {
    const grid = [];
    const n = this._matrix.length;
    const m = this._matrix[0].length;
    for (let i = 0; i < n; i++) {
      const row = new Array(m).fill('_');
      grid.push(row);
    }
    return grid;
  }

  _revealGrid() {
    for (let i = 0; i < this._matrix.length; i++) {
      for (let j = 0; j < this._matrix[i].length; j++) {
        const value = this._matrix[i][j];
        if (value === 1 || value === 4) {
          this._grid[i][j] = 'B';
        }
      }
    }
    return this._grid;
  }

  _countBombs(row, col) {
    let counter = 0;
    for (let i = -1; i <= 1; i++) {
      if (this._matrix[row + i]) {
        for (let j = -1; j <= 1; j++) {
          const value = this._matrix[row + i][col + j];
          if (value !== undefined && (value === 1 || value === 4)) {
            counter++;
          }
        }
      }
    }
    return counter;
  }

  _markCellAsVisited(x, y, numbBombs) {
    this._matrix[x][y] = 2;
    this._numRevealedCells++;
    this._grid[x][y] = numbBombs.toString();
  }

  /**
   * Iterative BFS to sweep matrix for bombs.
   * @param {integer} row
   * @param {integer} col
   */
  _sweep(row, col) {
    const q = new Queue();
    q.enqueue([row, col]);
    while (!q.isEmpty()) {
      const [x, y] = q.dequeue();
      if (this._matrix[x]) {
        const cell = this._matrix[x][y];
        if (cell === undefined || cell === 1 || cell === 2 || cell === 4) {
          continue;
        }
        const numbBombs = this._countBombs(x, y);
        if (numbBombs === 0) {
          q.enqueue([x - 1, y - 1]);
          q.enqueue([x - 1, y]);
          q.enqueue([x - 1, y + 1]);
          q.enqueue([x, y - 1]);
          q.enqueue([x, y + 1]);
          q.enqueue([x + 1, y - 1]);
          q.enqueue([x + 1, y]);
          q.enqueue([x + 1, y + 1]);
        }
        this._markCellAsVisited(x, y, numbBombs);
      }
    }
  }

  _gameWon() {
    const remainingCells =
      this._numRows * this._numColumns - this._numRevealedCells;

    return remainingCells === this._numBombs;
  }

  getNumRows() {
    return this._numRows;
  }

  getNumColumns() {
    return this._numColumns;
  }

  getNumBombs() {
    return this._numBombs;
  }

  getStatus() {
    return this._status;
  }

  getGrid() {
    return this._grid;
  }

  flagCell(row, col) {
    if (this._status === 'in-progress') {
      const cell = this._matrix[row][col];
      if (cell !== 2) {
        this._matrix[row][col] = this._cellStateToggleMapping[cell];
      }
    }
  }

  cellIsFlagged(row, col) {
    const cell = this._matrix[row][col];
    return cell === 3 || cell === 4;
  }

  checkCell(row, col) {
    if (this._status === 'in-progress') {
      const cell = this._matrix[row][col];
      if (cell === 1 || cell === 4) {
        this._status = 'lost';
        this._revealGrid();
      }
      this._sweep(row, col);
      if (this._gameWon()) {
        this._status = 'won';
        this._revealGrid();
      }
    }
  }
}

module.exports = MinesweeperGame;
export default MinesweeperGame;
