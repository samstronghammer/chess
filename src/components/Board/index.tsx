import React, {Component} from "react";
import styles from './styles.scss';
import * as _ from 'lodash';
import * as CSS from 'csstype';
import {BoardLocation, Game, pieceToChar, pieceToPath} from "../../services/types/gamestate";
import Util, { GColor } from "../../services/util"

interface Props {
    game: Game
    makeMove: (from: BoardLocation, to: BoardLocation) => void
}

interface State {
    selectedLocation: BoardLocation | undefined
}

class Board extends Component<Props, State> {

    private static readonly darkColor = new GColor(76, 43, 0)
    private static readonly lightColor = new GColor(170, 121, 56)
    private static readonly highlightColor = new GColor(255, 255, 0)

    constructor(props: Props) {
        super(props)
        this.state = {
            selectedLocation: undefined
        }
    }

    getSquares = (): JSX.Element[] => {
        const moveSquares = this.state.selectedLocation === undefined ? new Set() : Util.boardLocationSetToStringSet(this.props.game.getMovesFrom(this.state.selectedLocation))
        // console.log(moveSquares)
        return _.range(0, 64).map((i) => {
            const r = Math.floor(i / 8);
            const c = i % 8;
            const boardLocation = new BoardLocation(r, c)
            const color = (r + c) % 2 === 0 ? Board.lightColor : Board.darkColor;
            const style: CSS.Properties = {
                width: "12.5%",
                height: "12.5%",
                position: "absolute",
                left: `${c * 12.5}%`,
                top: `${r * 12.5}%`,
                backgroundColor: moveSquares.has(boardLocation.toString()) ? Util.mixColors(color, Board.highlightColor).toString() : color.toString(),
            };
            const imgStyle: CSS.Properties = {
                margin: "10%",
                maxWidth: "80%",
                maxHeight: "80%",
            }
            const onClick = () => {
                if (moveSquares.has(boardLocation.toString())) {
                    console.log("Making move")
                    this.props.makeMove(this.state.selectedLocation, boardLocation)
                    this.setState({selectedLocation: undefined})
                } else {
                    this.setState({selectedLocation: boardLocation})
                }
            }
            const piece = this.props.game.getAt(boardLocation)
            return <div style={style} onClick={onClick} key={i}>
                {piece && <img style={imgStyle} src={pieceToPath(piece)}/>}
                </div>
        })
    };

    render() {
        return (
            <div className={styles.boardContainer}>
                {this.getSquares()}
            </div>
        )
    }
}

export default Board;