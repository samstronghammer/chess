import Immutable from 'immutable';
import {Char, toBoardString, toGameString} from '../types';
import { range, random } from 'lodash';
import { BoardLocation } from '../types/gamestate';
import {Set} from 'immutable'

export class GColor {
    constructor(readonly r: number, readonly g: number, readonly b: number, readonly a: number = 1) {}

    toString = (): string => {
        return this.a == 1 ? `rgb(${this.r},${this.g},${this.b})` : `rgba(${this.r},${this.g},${this.b},${this.a})`
    }
}

export default class Util {

    static readonly initialBoard = toBoardString("rnbqkbnrpppppppp................................PPPPPPPPRNBQKBNR");
    static readonly initialGame = toGameString(Util.initialBoard + "ffffffffttttW");

    static readonly randomString = (len: number, chars: Iterable<Char>) => {
        const charArray = Array.from(chars);
        return range(len).map(_ => charArray[random(len - 1)])
    };

    static readonly createColorRange = (c1: GColor, c2: GColor, len: number): Immutable.List<GColor> => {
        let colorList = [];
        for (let i = 0; i < len; i++) {
            const tmpColor = new GColor(
                c1.r + ((i*(c2.r-c1.r))/len),
                c1.g + ((i*(c2.g-c1.g))/len),
                c1.b + ((i*(c2.b-c1.b))/len),
                c1.a + ((i*(c2.a-c1.a))/len)
            );
            colorList.push(tmpColor);
        }
        return Immutable.List(colorList);
    };

    static readonly mixColors = function(c1: GColor, c2: GColor): GColor {
        return new GColor((c1.r + c2.r) / 2, (c1.g + c2.g) / 2, (c1.b + c2.b) / 2, (c1.a + c2.a) / 2);
    };

    static readonly boardLocationSetToStringSet = (locationSet: Set<BoardLocation>): Set<string> => {
        return locationSet.map((location: BoardLocation) => location.toString())
    }

    static readonly setCharAt = (s: string, i: number, c: Char): string => {
        if (i > s.length - 1) return s;
        return s.substring(0, i) + c + s.substring(i + 1);
    }

}
