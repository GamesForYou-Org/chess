export enum Piece {
  Rook,
  Queen,
  Bishop,
  Knight,
  King,
  Pawn
}

const pieceValues: Array<number> = [];
pieceValues[Piece.King] = Number.MAX_SAFE_INTEGER;
pieceValues[Piece.Queen] = 9;
pieceValues[Piece.Rook] = 5;
pieceValues[Piece.Bishop] = 3;
pieceValues[Piece.Knight] = 3;
pieceValues[Piece.Pawn] = 1;

export enum PieceColor {
  Black,
  White
}

export class Position {
  constructor(readonly row: number, readonly column: number) {}
}

export class BoardPiece {
  constructor(readonly piece: Piece, readonly color: PieceColor) {}

  static withe(piece: Piece): BoardPiece {
    return new BoardPiece(piece, PieceColor.White);
  }

  static black(piece: Piece): BoardPiece {
    return new BoardPiece(piece, PieceColor.Black);
  }

  getPiece(): Piece {
    return this.piece;
  }

  getPieceColor(): PieceColor {
    return this.color;
  }
}

enum MoveResult {
  ALLOWED,
  NOT_ALLOWED,
  SMALL_CASTLING_ALLOWED,
  BIG_CASTLING_ALLOWED,
  ALLOWED_EN_PASSANT,
  ALLOWED_BLACK_GET_EN_PASSANT_WHITE,
  ALLOWED_WHITE_GET_EN_PASSANT_BLACK,
  PAWN_PROMOTION
}

interface MoveValidator {
  isAllowed: (board: Board, from: Position, to: Position) => MoveResult;
}

abstract class AbstractMoveValidator implements MoveValidator {
  isAllowed(board: Board, from: Position, to: Position): MoveResult {
    const b = board.getBoard();
    const fromPiece = b[from.row][from.column];
    const toPiece = b[to.row][to.column];

    if (toPiece && fromPiece?.color === toPiece.color) {
      return MoveResult.NOT_ALLOWED;
    }

    return MoveResult.ALLOWED;
  }
}

class RookMoveValidator extends AbstractMoveValidator {
  isAllowed(board: Board, from: Position, to: Position): MoveResult {
    if (super.isAllowed(board, from, to) === MoveResult.NOT_ALLOWED) {
      return MoveResult.NOT_ALLOWED;
    }
    const sameRow = from.row === to.row;
    const sameCol = from.column === to.column;

    if (!(sameRow || sameCol)) {
      return MoveResult.NOT_ALLOWED;
    }
    const b = board.getBoard();
    const lt = (a: number, b: number) => a < b;
    const gt = (a: number, b: number) => a > b;

    const fromValue = sameRow ? from.column : from.row;
    const toValue = sameRow ? to.column : to.row;
    const inc = sameRow
      ? from.column < to.column
        ? 1
        : -1
      : from.row < to.row
      ? 1
      : -1;

    const op = sameRow
      ? from.column < to.column
        ? lt
        : gt
      : from.row < to.row
      ? lt
      : gt;

    const getValue: (i: number) => BoardPiece | null = i => {
      if (sameRow) {
        return b[from.row][i];
      }
      return b[i][from.column];
    };

    for (let i = fromValue + inc; op(i, toValue); i = i + inc) {
      if (getValue(i)) {
        return MoveResult.NOT_ALLOWED;
      }
    }

    return MoveResult.ALLOWED;
  }
}

class BishopMoveValidator extends AbstractMoveValidator {
  isAllowed(board: Board, from: Position, to: Position): MoveResult {
    if (super.isAllowed(board, from, to) === MoveResult.NOT_ALLOWED) {
      return MoveResult.NOT_ALLOWED;
    }
    const b = board.getBoard();

    const rowDiff = from.row - to.row;
    const colDiff = from.column - to.column;
    const diagonal = Math.abs(rowDiff) === Math.abs(colDiff);
    if (!diagonal) {
      return MoveResult.NOT_ALLOWED;
    }

    const lt = (a: number, b: number) => a < b;
    const gt = (a: number, b: number) => a > b;
    const rowInc = rowDiff > 0 ? 1 : -1;
    const colInc = colDiff > 0 ? 1 : -1;
    const rowOp = rowDiff > 0 ? lt : gt;
    const colOp = colDiff > 0 ? lt : gt;

    for (let r = from.row + rowInc; rowOp(r, to.row); r = r + rowInc) {
      for (let c = from.column + colInc; colOp(c, to.column); c = c + colInc) {
        if (b[r][c]) {
          return MoveResult.NOT_ALLOWED;
        }
      }
    }

    return MoveResult.ALLOWED;
  }
}

class QueenMoveValidator extends AbstractMoveValidator {
  isAllowed(board: Board, from: Position, to: Position): MoveResult {
    const v1 = new RookMoveValidator();
    const v2 = new BishopMoveValidator();
    const r = v1.isAllowed(board, from, to);

    return r === MoveResult.ALLOWED ? r : v2.isAllowed(board, from, to);
  }
}

class KingMoveValidator extends AbstractMoveValidator {
  isAllowed(board: Board, from: Position, to: Position): MoveResult {
    if (super.isAllowed(board, from, to) === MoveResult.NOT_ALLOWED) {
      return MoveResult.NOT_ALLOWED;
    }

    const fromPiece = board.getBoard()[from.row][from.column];
    if (!fromPiece) {
      return MoveResult.NOT_ALLOWED;
    }

    const color = fromPiece.color;
    const rowDiff = Math.abs(from.row - to.row);
    const colDiff = Math.abs(from.column - to.column);

    const verifyCheckAndCastling = color === board.getCurrent();

    const allowed = rowDiff <= 1 && colDiff <= 1;

    if (allowed) {
      if (verifyCheckAndCastling) {
        if (board.isCheck(to)) {
          return MoveResult.NOT_ALLOWED;
        } else {
          return MoveResult.ALLOWED;
        }
      } else {
        return MoveResult.ALLOWED;
      }
    } else if (verifyCheckAndCastling) {
      return this.isCastlingAllowed(board, from, to);
    }

    return MoveResult.NOT_ALLOWED;
  }

  private isCastlingAllowed(
    board: Board,
    from: Position,
    to: Position
  ): MoveResult {
    if (board.getCurrentKingMoved()) {
      return MoveResult.NOT_ALLOWED;
    }
    if (
      to.column === 6 &&
      (to.row === 0 || to.row === 7) &&
      board.getCurrentRookKingMoved()
    ) {
      return MoveResult.NOT_ALLOWED;
    }

    if (
      to.column === 2 &&
      (to.row === 0 || to.row === 7) &&
      board.getCurrentRookQueenMoved()
    ) {
      return MoveResult.NOT_ALLOWED;
    }

    let op: (a: number, b: number) => boolean;
    let inc: number;
    let start: number;
    let end: number;
    let smallCastling: boolean;
    if (to.column === 6 && (to.row === 0 || to.row === 7)) {
      // small castling
      op = (a, b) => a <= b;
      inc = 1;
      start = 5;
      end = 6;
      smallCastling = true;
    } else if (to.column === 2 && (to.row === 0 || to.row === 7)) {
      // big castling
      op = (a, b) => a >= b;
      inc = -1;
      start = 1;
      end = 3;
      smallCastling = false;
    } else {
      return MoveResult.NOT_ALLOWED;
    }

    for (let c = from.column + inc; op(c, to.column); c++) {
      if (board.isCheck(new Position(from.row, c))) {
        return MoveResult.NOT_ALLOWED;
      }
    }

    for (let c = start; c <= end; c++) {
      if (board.getBoard()[from.row][c]) {
        return MoveResult.NOT_ALLOWED;
      }
    }

    return smallCastling
      ? MoveResult.SMALL_CASTLING_ALLOWED
      : MoveResult.BIG_CASTLING_ALLOWED;
  }
}

class PawnMoveValidator extends AbstractMoveValidator {
  isAllowed(board: Board, from: Position, to: Position): MoveResult {
    const b = board.getBoard();
    if (
      (from.row === 6 && to.row === 4 && from.column === to.column) ||
      (from.row == 1 && to.row == 3 && from.column === to.column)
    ) {
      const bp = b[to.row][to.column];
      if (bp) {
        return MoveResult.NOT_ALLOWED;
      } else {
        return MoveResult.ALLOWED_EN_PASSANT;
      }
    }

    if (
      from.column === to.column &&
      (from.row + 1 === to.row || from.row - 1 === to.row)
    ) {
      const bp = b[to.row][to.column];
      if (bp) {
        return MoveResult.NOT_ALLOWED;
      } else {
        return to.row === 7 || to.row === 0
          ? MoveResult.PAWN_PROMOTION
          : MoveResult.ALLOWED;
      }
    }

    if (
      (from.row + 1 == to.row || from.row - 1 == to.row) &&
      (from.column + 1 === to.column || from.column - 1 === to.column)
    ) {
      const bp = b[to.row][to.column];
      if (bp && bp.color === board.getCurrent()) {
        return to.row === 7 || to.row === 0
          ? MoveResult.PAWN_PROMOTION
          : MoveResult.ALLOWED;
      } else if (bp) {
        return MoveResult.ALLOWED;
      } else if (from.row + 1 == to.row) {
        const maybePassant = b[from.row][to.column];
        if (maybePassant && maybePassant === board.getEnPassant()) {
          return MoveResult.ALLOWED_BLACK_GET_EN_PASSANT_WHITE;
        } else {
          return MoveResult.NOT_ALLOWED;
        }
      } else if (from.row - 1 == to.row) {
        const maybePassant = b[from.row][to.column];
        if (maybePassant && maybePassant === board.getEnPassant()) {
          return MoveResult.ALLOWED_WHITE_GET_EN_PASSANT_BLACK;
        } else {
          return MoveResult.NOT_ALLOWED;
        }
      }
    }
    return MoveResult.NOT_ALLOWED;
  }
}

class KnightMoveValidator extends AbstractMoveValidator {
  isAllowed(board: Board, from: Position, to: Position): MoveResult {
    if (super.isAllowed(board, from, to) == MoveResult.NOT_ALLOWED) {
      return MoveResult.NOT_ALLOWED;
    }

    const rowDiff = Math.abs(from.row - to.row);
    const colDiff = Math.abs(from.column - to.column);

    return (rowDiff === 1 && colDiff === 2) || (rowDiff === 2 && colDiff === 1)
      ? MoveResult.ALLOWED
      : MoveResult.NOT_ALLOWED;
  }
}

const moveValidators: Array<MoveValidator> = [];
moveValidators[Piece.Bishop] = new BishopMoveValidator();
moveValidators[Piece.Knight] = new KnightMoveValidator();
moveValidators[Piece.Pawn] = new PawnMoveValidator();
moveValidators[Piece.Rook] = new RookMoveValidator();
moveValidators[Piece.Queen] = new QueenMoveValidator();
moveValidators[Piece.King] = new KingMoveValidator();

export enum Capture {
  Yes,
  No
}

// TODO: implement draws
// TODO: implement not keep own king in check
export class Board {
  private board: Array<Array<BoardPiece | null>>;
  private current: PieceColor;
  private kingBlackMoved = false;
  private kingWhiteMoved = false;
  private rookQueenWhiteMoved = false;
  private rookQueenBlackMoved = false;
  private rookKingWhiteMoved = false;
  private rookKingBlackMoved = false;
  private enPassant: BoardPiece | null = null;

  constructor() {
    this.board = this.createBoard();
    this.current = PieceColor.White;
  }

  getCurrentKingMoved(): boolean {
    if (this.current === PieceColor.White) {
      return this.getKingWhiteMoved();
    }

    return this.getKingBlackMoved();
  }

  getEnPassant(): BoardPiece | null {
    return this.enPassant;
  }

  getKingBlackMoved(): boolean {
    return this.kingBlackMoved;
  }

  getKingWhiteMoved(): boolean {
    return this.kingWhiteMoved;
  }

  getCurrentRookQueenMoved(): boolean {
    if (this.current == PieceColor.White) {
      return this.getRookQueenWhiteMoved();
    }
    return this.getRookQueenBlackMoved();
  }

  getCurrentRookKingMoved(): boolean {
    if (this.current == PieceColor.White) {
      return this.getRookKingWhiteMoved();
    }
    return this.getRookKingBlackMoved();
  }

  getRookQueenWhiteMoved(): boolean {
    return this.rookQueenWhiteMoved;
  }

  getRookQueenBlackMoved(): boolean {
    return this.rookQueenBlackMoved;
  }

  getRookKingWhiteMoved(): boolean {
    return this.rookKingWhiteMoved;
  }

  getRookKingBlackMoved(): boolean {
    return this.rookKingBlackMoved;
  }

  getCurrent(): PieceColor {
    return this.current;
  }

  getBoard(): Array<Array<BoardPiece | null>> {
    return this.board;
  }

  move(from: Position, to: Position): Capture {
    const boardPiece = this.board[from.row][from.column];
    if (!boardPiece) {
      throw new Error("No piece in from position");
    }
    if (boardPiece.color !== this.current) {
      throw new Error("Not your turn " + boardPiece.color);
    }
    const moveAllowed = this.moveAllowed(boardPiece, from, to);
    if (moveAllowed === MoveResult.NOT_ALLOWED) {
      throw new Error("move not allowed");
    }

    if (moveAllowed === MoveResult.ALLOWED_EN_PASSANT) {
      this.enPassant = this.board[from.row][from.column];
      this.board[to.row][to.column] = boardPiece;
      this.board[from.row][from.column] = null;
      this.current =
        this.current === PieceColor.White ? PieceColor.Black : PieceColor.White;

      return Capture.No;
    }

    if (moveAllowed === MoveResult.PAWN_PROMOTION) {
      const toBp = this.board[to.row][to.column];
      this.board[to.row][to.column] = new BoardPiece(Piece.Queen, this.current);
      this.board[from.row][from.column] = null;
      this.current =
        this.current === PieceColor.White ? PieceColor.Black : PieceColor.White;

      return toBp ? Capture.Yes : Capture.No;
    }

    this.enPassant = null;
    if (moveAllowed === MoveResult.ALLOWED_BLACK_GET_EN_PASSANT_WHITE) {
      this.board[to.row - 1][to.column] = null;
      this.board[to.row][to.column] = boardPiece;
      this.board[from.row][from.column] = null;
      this.current =
        this.current === PieceColor.White ? PieceColor.Black : PieceColor.White;

      return Capture.Yes;
    }

    if (moveAllowed === MoveResult.ALLOWED_WHITE_GET_EN_PASSANT_BLACK) {
      this.board[to.row + 1][to.column] = null;
      this.board[to.row][to.column] = boardPiece;
      this.board[from.row][from.column] = null;
      this.current =
        this.current === PieceColor.White ? PieceColor.Black : PieceColor.White;

      return Capture.Yes;
    }

    if (moveAllowed === MoveResult.BIG_CASTLING_ALLOWED) {
      const rookRow = this.current === PieceColor.White ? 7 : 0;
      this.board[to.row][to.column] = boardPiece;
      this.board[from.row][from.column] = null;
      this.board[to.row][to.column + 1] = this.board[rookRow][0];
      this.board[rookRow][0] = null;

      if (this.current === PieceColor.White) {
        this.kingWhiteMoved = true;
        this.rookQueenWhiteMoved = true;
      } else {
        this.kingBlackMoved = true;
        this.rookQueenBlackMoved = true;
      }

      this.current =
        this.current === PieceColor.White ? PieceColor.Black : PieceColor.White;

      return Capture.No;
    }

    if (moveAllowed === MoveResult.SMALL_CASTLING_ALLOWED) {
      const rookRow = this.current === PieceColor.White ? 7 : 0;
      this.board[to.row][to.column] = boardPiece;
      this.board[from.row][from.column] = null;
      this.board[to.row][to.column - 1] = this.board[rookRow][7];
      this.board[rookRow][7] = null;

      if (this.current === PieceColor.White) {
        this.kingWhiteMoved = true;
        this.rookKingWhiteMoved = true;
      } else {
        this.kingBlackMoved = true;
        this.rookKingBlackMoved = true;
      }

      this.current =
        this.current === PieceColor.White ? PieceColor.Black : PieceColor.White;

      return Capture.No;
    }

    const toBoardPiece = this.board[to.row][to.column];
    this.board[to.row][to.column] = boardPiece;
    this.board[from.row][from.column] = null;

    if (boardPiece.piece === Piece.King) {
      if (this.current === PieceColor.White) {
        this.kingWhiteMoved = true;
      } else {
        this.kingBlackMoved = true;
      }
    }

    if (boardPiece.piece === Piece.Rook) {
      if (this.current === PieceColor.White) {
        if (from.row === 7 && from.column === 0) {
          this.rookQueenWhiteMoved = true;
        } else if (from.row === 7 && from.column === 7) {
          this.rookKingWhiteMoved = true;
        }
      } else {
        if (from.row === 0 && from.column === 0) {
          this.rookQueenBlackMoved = true;
        } else if (from.row === 0 && from.column === 7) {
          this.rookKingBlackMoved = true;
        }
      }
    }

    this.current =
      this.current === PieceColor.White ? PieceColor.Black : PieceColor.White;

    return toBoardPiece ? Capture.Yes : Capture.No;
  }

  // TODO: fix bug pawn
  // TODO: fix bug bishop
  isCheck(to: Position): boolean {
    const opColor =
      this.current === PieceColor.White ? PieceColor.Black : PieceColor.White;

    for (let r = 0; r < this.board.length; r++) {
      for (let c = 0; c < this.board[r].length; c++) {
        const bp = this.board[r][c];
        if (bp && bp.color === opColor) {
          const moveAllowed = this.moveAllowed(bp, new Position(r, c), to);
          if (moveAllowed === MoveResult.ALLOWED) {
            console.log("Check " + bp.getPiece() + " from " + r + "," + c);
            return true;
          }
        }
      }
    }
    return false;
  }

  private moveAllowed(
    boardPiece: BoardPiece,
    from: Position,
    to: Position
  ): MoveResult {
    const piece = boardPiece.piece;
    return moveValidators[piece].isAllowed(this, from, to);
  }

  private createBoard(): Array<Array<BoardPiece | null>> {
    const board: Array<Array<BoardPiece | null>> = [];

    this.fillBoard(board, 7, 6, BoardPiece.withe);
    this.fillBoard(board, 0, 1, BoardPiece.black);

    for (let i = 2; i <= 5; i++) {
      board[i] = [];
      for (let j = 0; j <= 7; j++) {
        board[i][j] = null;
      }
    }

    return board;
  }

  private fillBoard(
    board: Array<Array<BoardPiece | null>>,
    firstRow: number,
    secondRow: number,
    createFn: (piece: Piece) => BoardPiece
  ) {
    board[firstRow] = [];
    board[firstRow][0] = createFn(Piece.Rook);
    board[firstRow][1] = createFn(Piece.Knight);
    board[firstRow][2] = createFn(Piece.Bishop);
    board[firstRow][3] = createFn(Piece.Queen);
    board[firstRow][4] = createFn(Piece.King);
    board[firstRow][5] = createFn(Piece.Bishop);
    board[firstRow][6] = createFn(Piece.Knight);
    board[firstRow][7] = createFn(Piece.Rook);
    board[secondRow] = [];
    for (let i = 0; i < 8; i++) {
      board[secondRow][i] = createFn(Piece.Pawn);
    }
  }
}
