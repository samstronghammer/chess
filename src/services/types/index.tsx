import * as Immutable from 'immutable'

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