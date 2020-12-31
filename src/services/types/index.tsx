
export class Pair<T, U> {
    readonly first: T;
    readonly second: U;

    constructor(first: T, second: U) {
        this.first = first;
        this.second = second;
    }
}

enum CharType {}
export type Char = string & CharType
export const isChar = (str: string): str is Char => /^(.|\n)$/.test(str || "");
export const toChar = (c: string): Char => {
    if (!isChar(c)){
        throw new Error('not a char')
    }
    return c
};

enum PieceCharType {}
export type PieceChar = string & PieceCharType
export const isPieceChar = (str: string): str is PieceChar => /^([pPnNbBrRqQkK\.])$/.test(str || "");
export const toPieceChar = (c: string): PieceChar => {
    if (!isPieceChar(c)){
        throw new Error('not a piece char')
    }
    return c
};

enum BoardStringType {}
export type BoardString = string & BoardStringType
// Ensure that board string only contains the relevant characters
export const isBoardString = (str: string): str is BoardString => {
    return /^([pPnNbBrRqQkK.]{64})$/.test(str || "")
};
export const toBoardString = (c: string): BoardString => {
    if (!isBoardString(c)){
        throw new Error('not a board string')
    }
    return c
};

enum GameStringType {}
export type GameString = string & GameStringType
// Ensure that board string only contains the relevant characters
export const isGameString = (str: string): str is GameString => {
    return /^([pPnNbBrRqQkK.]{64}[tf]{8}[tf]{4}[WB])$/.test(str || "")
};
export const toGameString = (c: string): GameString => {
    if (!isGameString(c)){
        throw new Error('not a game string')
    }
    return c
};