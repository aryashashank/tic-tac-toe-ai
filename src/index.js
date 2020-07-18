import React from "react";
import ReactDOM from "react-dom";
import "./style.css";

function Square(props) {
  return (
    <button
      onClick={props.onClick}
      className={
        props.isWinner
          ? "winner square"
          : props.isLastMovedIndex
          ? "lastMoved square"
          : "square"
      }
    >
      {props.value}
    </button>
  );
}

class Board extends React.Component {
  renderSquare(i) {
    const isWinner = this.props.winningIndices.indexOf(i) > -1;
    const isLastMovedIndex = this.props.lastMovedIndex === i;
    return (
      <Square
        key={i}
        isWinner={isWinner}
        value={this.props.squares[i]}
        isLastMovedIndex={isLastMovedIndex}
        onClick={() => this.props.onClick(i)}
      />
    );
  }

  renderCells(i) {
    let cells = [];
    for (let j = 0; j < 3; j++) {
      cells.push(this.renderSquare(i + j));
    }
    return cells;
  }

  render() {
    let table = [];
    for (let a = 0; a < 7; a = a + 3) {
      table.push(
        <div key={a + 9} className="board-row">
          {this.renderCells(a)}
        </div>
      );
    }
    return <div>{table}</div>;
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [
        {
          squares: Array(9).fill(null),
          lastMovedIndex: null,
        },
      ],
      xIsNext: true,
      stepNumber: 0,
      isGameStarted: false,
      opponent: "x",
    };
  }

  handleClick(i) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1);
    const current = history[this.state.stepNumber];
    const squares = current.squares.slice();
    if (calculateWinner(squares).winner || squares[i]) {
      return;
    }
    squares[i] = this.state.xIsNext ? "X" : "O";
    this.setState(
      {
        history: history.concat([
          {
            squares: squares,
            lastMovedIndex: i,
          },
        ]),
        xIsNext: !this.state.xIsNext,
        stepNumber: history.length,
      },
      () => {
        this.moveComputer();
      }
    );
  }

  moveComputer() {
    if (this.isComputerMove()) {
      const history = this.state.history.slice(0, this.state.stepNumber + 1);
      const current = history[this.state.stepNumber];
      const squares = current.squares.slice();
      const { winner, draw } = calculateWinner(squares);
      if (winner || draw) return;
      const player = this.state.opponent === "X" ? "O" : "X";
      const square = findBestMove(squares, player, this.state.opponent);
      squares[square] = player;
      this.setState(
        {
          history: history.concat([
            {
              squares: squares,
              lastMovedIndex: square,
            },
          ]),
          xIsNext: !this.state.xIsNext,
          stepNumber: history.length,
        },
        () => {
          this.moveComputer();
        }
      );
    }
  }

  isComputerMove() {
    return (
      (this.state.xIsNext && this.state.opponent === "O") ||
      (!this.state.xIsNext && this.state.opponent === "X")
    );
  }

  // jumpTo(isNext) {
  //   const history = this.state.history;
  //   const step = isNext ? this.state.stepNumber + 1 : this.state.stepNumber - 1;
  //   if (step >= 0 && step < history.length) {
  //     this.setState({
  //       stepNumber: step,
  //       xIsNext: step % 2 === 0,
  //     });
  //   }
  // }
  startGame() {
    this.setState(
      {
        isGameStarted: !this.state.isGameStarted,
      },
      () => {
        this.moveComputer();
      }
    );
  }

  endGame() {
    this.setState({
      history: [
        {
          squares: Array(9).fill(null),
          lastMovedIndex: null,
        },
      ],
      xIsNext: true,
      stepNumber: 0,
      isGameStarted: false,
      opponent: "x",
    });
  }

  handleOptionChange(changeEvent) {
    this.setState({
      opponent: changeEvent.target.value,
    });
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    const { winner, winningIndices, draw } = calculateWinner(current.squares);
    let status;
    if (winner) {
      status = "Winner: " + winner;
    } else if (!draw) {
      status = "Next player: " + (this.state.xIsNext ? "X" : "O");
    } else {
      status = "Game is drawn";
    }

    return (
      <div className="game">
        {this.state.isGameStarted ? (
          <div className="game-container">
            <div className="game-board">
              <Board
                squares={current.squares}
                winningIndices={winningIndices}
                lastMovedIndex={current.lastMovedIndex}
                onClick={(i) => this.handleClick(i)}
              />
              {/* <div className="history-buttons">
                <p>Moves:</p>
                <button onClick={() => this.jumpTo(false)}>Previous</button>
                <button onClick={() => this.jumpTo(true)}>Next</button>
              </div> */}
              <div className="restart">
                <button onClick={() => this.endGame()}>Restart</button>
              </div>
            </div>
            <div className="game-info">
              <div>{status}</div>
            </div>
          </div>
        ) : (
          <div className="game-startup">
            <p>X moves first. Pick your side</p>
            <input
              type="radio"
              name="player"
              value="X"
              onChange={(changeEvent) => this.handleOptionChange(changeEvent)}
              checked={this.state.opponent === "X"}
            />
            <label htmlFor="player">X</label>
            <br />
            <input
              type="radio"
              name="player"
              value="O"
              onChange={(changeEvent) => this.handleOptionChange(changeEvent)}
              checked={this.state.opponent === "O"}
            />
            <label htmlFor="player">O</label>
            <br />
            <br />
            <div>
              <button onClick={() => this.startGame()}>Start Game</button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

// ========================================

ReactDOM.render(<Game />, document.getElementById("root"));

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return {
        winner: squares[a],
        winningIndices: [a, b, c],
        draw: false,
      };
    }
  }
  if (squares.indexOf(null) < 0) {
    return {
      winner: null,
      winningIndices: [],
      draw: true,
    };
  }
  return {
    winner: null,
    winningIndices: [],
    draw: false,
  };
}

function minimax(squares, player, opponent, depth, isMax) {
  let board = squares.slice();
  const { winner, draw } = calculateWinner(board);
  if (winner && winner === player) {
    return 100;
  }
  if (winner && winner === opponent) {
    return -100;
  }
  if (draw) {
    return 0;
  }

  if (isMax) {
    let best = -1000;
    // Traverse all cells
    for (let i = 0; i < board.length; i++) {
      // Check if cell is empty
      if (board[i] === null) {
        board[i] = player;
        // Call minimax recursively and choose
        // the maximum value
        best = Math.max(best, minimax(board, player, opponent, depth + 1, !isMax));

        // Undo the move
        board[i] = null;
      }
    }
    return best - depth;
  } else {
    let best = 1000;
    for (let i = 0; i < squares.length; i++) {
      // Check if cell is empty
      if (board[i] === null) {
        // Make the move
        board[i] = opponent;

        // Call minimax recursively and choose
        // the minimum value
        best = Math.min(best, minimax(board, player, opponent, depth + 1, !isMax));

        // Undo the move
        board[i] = null;
      }
    }
    return best + depth;
  }
}

function findBestMove(squares, player, opponent) {
  let bestVal = -1000;
  let moveIndex = -1;
  for (let i = 0; i < squares.length; i++)
    // Check if cell is empty
    if (squares[i] === null) {
      // Make the move
      squares[i] = player;
      let moveVal = minimax(squares, player, opponent, 0, false);
      squares[i] = null;
      // If the value of the current move is
      // more than the best value, then update
      // best/
      if (moveVal > bestVal) {
        moveIndex = i;
        bestVal = moveVal;
      }
    }
  return moveIndex;
}
