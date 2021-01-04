import {BoardString, GameString, PieceChar, toBoardString, toGameString, toPieceChar} from "./index";
import Util from "../../services/util";
import {Pair} from "../../services/types";
import {Set, ValueObject, is, List, Map} from 'immutable'

export enum PieceEnum {
    PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING
}

export enum SideEnum {
    BLACK, WHITE
}

export enum ResultEnum {
    BLACK = "Black wins by checkmate.", 
    WHITE = "White wins by checkmate.", 
    STALEMATE = "Draw by stalemate.", 
    INSUFFICIENT = "Draw by insufficient material.", 
    REPITITION = "Draw by threefold repetition.", 
    FIFTY = "Draw by fifty move rule."
}

export class Piece implements ValueObject {
    constructor(readonly side: SideEnum, readonly piece: PieceEnum) {}

    equals = (other: any): boolean => {
        if ("side" in other && "piece" in other) {
            return other.side === this.side && other.piece === this.piece
        }
        return false
    }

    hashCode = (): number => {
        return this.side * 100 + this.piece
    }
}

const charPieceMap = Map<PieceEnum>({
    "P": PieceEnum.PAWN, 
    "N": PieceEnum.KNIGHT, 
    "B": PieceEnum.BISHOP, 
    "R": PieceEnum.ROOK, 
    "Q": PieceEnum.QUEEN, 
    "K": PieceEnum.KING
})

export const charToPiece = (pieceChar: PieceChar): Piece | undefined => {
    if (pieceChar === ".") {
        return undefined
    } else {
        const upperChar = `${pieceChar}`.toUpperCase()
        if (charPieceMap.has(upperChar)){
            const side = upperChar === pieceChar ? SideEnum.WHITE : SideEnum.BLACK;
            return new Piece(side, charPieceMap.get(upperChar))
        } else {
            throw new Error(`"${pieceChar}" is not a valid piece character.`)
        }
    }
};

const pieceCharMap = Map<PieceEnum, string>(Array.from(charPieceMap, entry => [entry[1], entry[0]]))

export const pieceToChar = (piece: Piece | undefined): PieceChar => {
    pieceCharMap
    if (piece === undefined) {
        return toPieceChar(".")
    } else {
        if (pieceCharMap.has(piece.piece)) {
            const pieceChar = pieceCharMap.get(piece.piece)
            return toPieceChar(piece.side === SideEnum.WHITE ? pieceChar : pieceChar.toLowerCase())
        } else {
            throw new Error(`${piece.piece} is an invalid piece enum`);
        }
    }
};

export const pieceToPath = (piece: Piece): string => {
    return `assets/svg/default/${(pieceToChar(piece) as string).toLowerCase()}_${piece.side === SideEnum.WHITE ? "white" : "black"}.svg`
}

interface CastlingRights {
    longCastle: boolean
    shortCastle: boolean
}

interface GameState {
    castlingRights: Map<SideEnum, CastlingRights>
    enPassant: List<boolean>
    turn: SideEnum
    boardString: BoardString
}

const gameStringToState = (gameString: GameString): GameState => {
    const s: string = gameString
    const s2 = s.slice(64)
    const castlingRights = Map<SideEnum, CastlingRights>()
        .set(SideEnum.WHITE, {longCastle: s2[10] === "t", shortCastle: s2[11] === "t"})
        .set(SideEnum.BLACK, {longCastle: s2[8] === "t", shortCastle: s2[9] === "t"})
    return {
        castlingRights: castlingRights,
        enPassant: List(s2.slice(0, 8)).map((c) => c === "t"),
        turn: s2[12] === "W" ? SideEnum.WHITE : SideEnum.BLACK,
        boardString: toBoardString(s.slice(0, 64))
    }
}

const stateToGameString = (gameState: GameState): GameString => {
    const s: string = gameState.boardString +
            gameState.enPassant.map((b) => b ? "t" : "f").join("") +
            (gameState.castlingRights.get(SideEnum.BLACK).longCastle ? "t" : "f") + 
            (gameState.castlingRights.get(SideEnum.BLACK).shortCastle ? "t" : "f") + 
            (gameState.castlingRights.get(SideEnum.WHITE).longCastle ? "t" : "f") + 
            (gameState.castlingRights.get(SideEnum.WHITE).shortCastle ? "t" : "f") +
            (gameState.turn === SideEnum.WHITE ? "W" : "B")
    return toGameString(s)
}

export class BoardLocation extends Pair<number, number> implements ValueObject {

    // As white, top left is 0, 0. As black, bottom right is 0, 0.
    get row(): number {return this.first}
    get column(): number {return this.second}

    constructor(row: number, column: number) {
        super(row, column)
        if (row < 0 || row > 7 || column < 0 || column > 7) {
            throw new Error("Row or column is out of bounds")
        }
    }

    toString = (): string => {
        return `${String.fromCharCode(65 + this.column)}${8 - this.row}`
    }

    add = (delta: Pair<number, number>, iterations: number = 1): BoardLocation | undefined => {
        try {
            return new BoardLocation(this.row + delta.first * iterations, this.column + delta.second * iterations)
        } catch {
            return undefined
        }
    }

    addAll = (deltas: Set<Pair<number, number>>): Set<BoardLocation> => {
        return deltas.map(delta => this.add(delta)).filter(loc => loc)
    }

    equals = (other: any): boolean => {
        if ("row" in other && "column" in other) {
            return other.row === this.row && other.column === this.column
        }
        return false
    }

    hashCode = (): number => {
        return this.row * 8 + this.column
    }

    static readonly fromString = (s: string): BoardLocation => {
        if (s.length != 2) {
            throw new Error(`"${s}" is not a valid board location`)
        }
        return new BoardLocation(s.charCodeAt(0) - 65, 8 - parseInt(s.slice(1)))
    }

    static readonly diag_vectors: Set<Pair<number, number>> = Set.of(new Pair(1, 1), new Pair(1, -1), new Pair(-1, 1), new Pair(-1, -1))
    static readonly adj_vectors: Set<Pair<number, number>> = Set.of(new Pair(1, 0), new Pair(-1, 0), new Pair(0, 1), new Pair(0, -1))
    static readonly knight_vectors: Set<Pair<number, number>> = Set.of(new Pair(2, 1), new Pair(2, -1), new Pair(-2, 1), new Pair(-2, -1),
        new Pair(1, 2), new Pair(-1, 2), new Pair(1, -2), new Pair(-1, -2))
}

export class Game {

    moveHistory: string[] = []
    stateHistory: Map<GameString, number>
    currentState: GameState
    result: ResultEnum | undefined

    constructor(gameString: GameString = Util.initialGame) {
        this.currentState = gameStringToState(gameString)
        this.stateHistory = Map()
        this.stateHistory.set(gameString, 1)
    }

    getAt = (location: BoardLocation): Piece | undefined => {
        let i = location.row * 8 + location.column;
        return charToPiece(toPieceChar(`${this.currentState.boardString}`.charAt(i)));
    };

    hasAt = (location: BoardLocation, piece: Piece): boolean => {
        return is(this.getAt(location), piece)
    }

    setAt = (location: BoardLocation, piece: Piece | undefined) => {
        this.currentState.boardString = toBoardString(Util.setCharAt(this.currentState.boardString, location.row * 8 + location.column, pieceToChar(piece)))
    }

    private followVector = (vector: Pair<number, number>, from: BoardLocation, side: SideEnum): Set<BoardLocation> => {
        let currLoc = from.add(vector)
        let moves = Set<BoardLocation>()
        while (currLoc && !this.getAt(currLoc)) {
            moves = moves.add(currLoc)
            currLoc = currLoc.add(vector)
        }
        if (currLoc && this.getAt(currLoc).side !== side) {
            moves = moves.add(currLoc)
        }
        return moves
    }

    getKingLocation = (side: SideEnum): BoardLocation => {
        const i = (this.currentState.boardString as string).indexOf(side === SideEnum.WHITE ? "K" : "k")
        if (i < 0 || i > 63) {
            throw new Error("King not found")
        }
        return new BoardLocation(Math.floor(i / 8), i % 8)
    }

    underAttackBy = (location: BoardLocation, side: SideEnum): boolean => {
        // Pawn
        const deltaRow = side === SideEnum.WHITE ? 1 : -1
        const pawnSquares = Set.of(location.add(new Pair(deltaRow, -1)), location.add(new Pair(deltaRow, 1)))
        if (pawnSquares.filter(loc => loc && is(this.getAt(loc), new Piece(side, PieceEnum.PAWN))).size > 0) {
            return true
        }
        // Knight
        if (location.addAll(BoardLocation.knight_vectors).filter(loc => is(this.getAt(loc), new Piece(side, PieceEnum.KNIGHT))).size > 0) {
            return true
        }
        // King
        if (location.addAll(BoardLocation.adj_vectors).union(location.addAll(BoardLocation.diag_vectors))
            .filter(loc => is(this.getAt(loc), new Piece(side, PieceEnum.KING))).size > 0) {
            return true
        }
        // Bishop/Queen
        let underAttack = false
        BoardLocation.diag_vectors.forEach((vec) => {
            let currLoc = location.add(vec)
            while (currLoc && !this.getAt(currLoc)) {
                currLoc = currLoc.add(vec)
            }
            if (currLoc) {
                if (is(this.getAt(currLoc), new Piece(side, PieceEnum.BISHOP)) || is(this.getAt(currLoc), new Piece(side, PieceEnum.QUEEN))) {
                    underAttack = true
                }
            }
            
        })
        if (underAttack) return true
        // Rook/Queen
        BoardLocation.adj_vectors.forEach((vec) => {
            let currLoc = location.add(vec)
            while (currLoc && !this.getAt(currLoc)) {
                currLoc = currLoc.add(vec)
            }
            if (currLoc) {
                if (is(this.getAt(currLoc), new Piece(side, PieceEnum.ROOK)) || is(this.getAt(currLoc), new Piece(side, PieceEnum.QUEEN))) {
                    underAttack = true
                }
            }
        })
        return underAttack
    }

    getMovesFrom = (location: BoardLocation): Set<BoardLocation> => {
        if (this.result) {
            return Set()
        }
        const {turn, castlingRights, enPassant} = this.currentState
        const piece = this.getAt(location)
        let moves: Set<BoardLocation> = Set()
        if (piece && piece.side === turn) {
            switch (piece.piece) {
                case (PieceEnum.PAWN):
                    const deltaRow = piece.side === SideEnum.WHITE ? -1 : 1
                    // Moving forward once or twice
                    const forwardPair = new Pair(deltaRow, 0)
                    if (!this.getAt(location.add(forwardPair))) {
                        moves = moves.add(location.add(forwardPair))
                        if ((location.row === 1 && piece.side === SideEnum.BLACK) || (location.row === 6 && piece.side === SideEnum.WHITE)) {
                            const forward2Pair = new Pair(deltaRow * 2, 0)
                            if (!this.getAt(location.add(forward2Pair))) {
                                moves = moves.add(location.add(forward2Pair))
                            }
                        }
                    }
                    // Taking diagonally
                    const diag1 = location.add(new Pair(deltaRow, -1))
                    const p1 = diag1 && this.getAt(diag1)
                    if (p1 && p1.side !== piece.side) moves = moves.add(diag1)
                    const diag2 = location.add(new Pair(deltaRow, 1))
                    const p2 = diag2 && this.getAt(diag2)
                    if (p2 && p2.side !== piece.side) moves = moves.add(diag2)
                    // Taking en passant
                    const enPassantRow = turn === SideEnum.WHITE ? 3 : 4
                    if (enPassantRow === location.row) {
                        if (enPassant.get(location.column - 1, false)) {
                            moves = moves.add(diag1)
                        }
                        if (enPassant.get(location.column + 1, false)) {
                            moves = moves.add(diag2)
                        }
                    }
                    break;
                case (PieceEnum.KNIGHT):
                    moves = location.addAll(BoardLocation.knight_vectors)
                    break;
                case (PieceEnum.KING):
                    moves = location.addAll(BoardLocation.adj_vectors).union(location.addAll(BoardLocation.diag_vectors))
                    if (castlingRights.get(turn).longCastle) {
                        const leftVector = new Pair(0, -1)
                        const locs = List.of(location.add(leftVector), location.add(leftVector, 2))
                        if (locs.filter(loc => this.getAt(loc) || this.underAttackBy(loc, turn === SideEnum.WHITE ? SideEnum.BLACK : SideEnum.WHITE)).size === 0) {
                            if (!this.getAt(location.add(leftVector, 3))) {
                                moves = moves.add(locs.get(1))
                            }
                        }
                    }
                    if (castlingRights.get(turn).shortCastle) {
                        const rightVector = new Pair(0, 1)
                        const locs = List.of(location.add(rightVector), location.add(rightVector, 2))
                        if (locs.filter(loc => this.getAt(loc) || this.underAttackBy(loc, turn === SideEnum.WHITE ? SideEnum.BLACK : SideEnum.WHITE)).size === 0) {
                            moves = moves.add(locs.get(1))
                        }
                    }
                    break;
                case (PieceEnum.BISHOP):
                    BoardLocation.diag_vectors.forEach((vec) => {
                        moves = moves.union(this.followVector(vec, location, piece.side))
                    })
                    break;
                case (PieceEnum.ROOK):
                    BoardLocation.adj_vectors.forEach((vec) => {
                        moves = moves.union(this.followVector(vec, location, piece.side))
                    })
                    break;
                case (PieceEnum.QUEEN):
                    BoardLocation.adj_vectors.union(BoardLocation.diag_vectors).forEach((vec) => {
                        moves = moves.union(this.followVector(vec, location, piece.side))
                    })
                    break;
                default:
                    break;
            }
        }
        return moves.filter(loc => this.getAt(loc) ? this.getAt(loc).side !== piece.side : true).filter(loc => this.legalMove(location, loc))
    }

    legalMove = (from: BoardLocation, to: BoardLocation): boolean => {
        const gameCopy = new Game(stateToGameString(this.currentState))
        gameCopy.makeMove(from, to, true)
        const kingLoc = gameCopy.getKingLocation(this.currentState.turn)
        return !gameCopy.underAttackBy(kingLoc, this.currentState.turn === SideEnum.WHITE ? SideEnum.BLACK : SideEnum.WHITE)
    }

    // makemove => haslegalmoves => getmovesfrom => legalmove => makemove
    hasLegalMoves = (): boolean => {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.getMovesFrom(new BoardLocation(row, col)).size > 0) {
                    return true
                }
            }
        }
        return false
    }

    inCheck = (): boolean => {
        const kingLocation = this.getKingLocation(this.currentState.turn);
        return this.underAttackBy(kingLocation, this.currentState.turn === SideEnum.WHITE ? SideEnum.BLACK : SideEnum.WHITE)
    }

    makeMove = (from: BoardLocation, to: BoardLocation, skipGameEndChecks = false) => {
        const {turn, castlingRights} = this.currentState
        this.currentState.enPassant = List.of(false, false, false, false, false, false, false, false)
        const piece = this.getAt(from)
        if (!piece) {
            throw new Error(`No piece found at ${from.toString()}`)
        }

        const piece2 = this.getAt(to)
        // If a piece is taken or a pawn is moved, reset state history.
        if (piece2 || piece.piece === PieceEnum.PAWN) {
            this.stateHistory = Map()
        }

        if (piece.piece === PieceEnum.KING && Math.abs(from.column - to.column) === 2) {
            // Castle
            this.setAt(from, undefined)
            this.setAt(to, piece)
            if (from.column - to.column > 0) {
                // Castling long
                this.setAt(to.add(new Pair(0, -2)), undefined)
                this.setAt(to.add(new Pair(0, 1)), new Piece(turn, PieceEnum.ROOK))
            } else {
                // Castling short
                this.setAt(to.add(new Pair(0, 1)), undefined)
                this.setAt(to.add(new Pair(0, -1)), new Piece(turn, PieceEnum.ROOK))
            }
            castlingRights.get(turn).longCastle = false
            castlingRights.get(turn).shortCastle = false
        } else if (piece.piece === PieceEnum.PAWN && (to.row === 7 || to.row === 0 || (Math.abs(from.column - to.column) === 1 && !this.getAt(to)))) {
            // En passant, promotion
            if (to.row === 7 || to.row === 0) {
                // TODO allow for promotion to other pieces
                this.setAt(from, undefined)
                this.setAt(to, new Piece(turn, PieceEnum.QUEEN))
            } else {
                // En Passant
                this.setAt(from, undefined)
                this.setAt(to, piece)
                const backwardPair = new Pair(piece.side === SideEnum.WHITE ? 1 : -1, 0)
                this.setAt(to.add(backwardPair), undefined)
            }
        } else {
            // Castling rights
            if (piece.piece === PieceEnum.KING) {
                castlingRights.get(turn).longCastle = false
                castlingRights.get(turn).shortCastle = false
            } else if (piece.piece === PieceEnum.ROOK) {
                const startRow = turn === SideEnum.WHITE ? 7 : 0
                if (from.row === startRow) {
                    if (from.column === 0) {
                        castlingRights.get(turn).longCastle = false
                    } else if (from.column === 7) {
                        castlingRights.get(turn).shortCastle = false
                    }
                }
            } else if (piece.piece === PieceEnum.PAWN && (from.row === 1 && piece.side === SideEnum.BLACK || from.row === 6 && piece.side === SideEnum.WHITE)) {
                if (Math.abs(to.row - from.row) === 2) {
                    this.currentState.enPassant = this.currentState.enPassant.set(from.column, true)
                }
            }
            this.setAt(from, undefined)
            this.setAt(to, piece)
        }        
        // Calculate new gameString
        const gameString = stateToGameString(this.currentState)
        // Put gameString into state history
        this.stateHistory = this.stateHistory.set(gameString, this.stateHistory.has(gameString) ? this.stateHistory.get(gameString) + 1 : 1)
        // Append move to move history
        this.moveHistory.push(`${from.toString()} -> ${to.toString()}`)
        // Flip turn
        this.currentState.turn = turn === SideEnum.WHITE ? SideEnum.BLACK : SideEnum.WHITE
        // Check for checkmate or draw
        if (!skipGameEndChecks) {
            if (!this.hasLegalMoves()) {
                if (this.inCheck()) {
                    this.result = turn === SideEnum.WHITE ? ResultEnum.WHITE : ResultEnum.WHITE
                    console.log(this.result)
                } else {
                    this.result = ResultEnum.STALEMATE
                }
            } else if (this.stateHistory.get(gameString) === 3){
                this.result = ResultEnum.REPITITION
            } else if (this.stateHistory.reduce((sum, x) => sum + x, 0) > 100) {
                this.result = ResultEnum.FIFTY
            }
        }
        // TODO insufficient material draw
    }
}

