import React, {Component} from "react";
import styles from './styles.scss';
import Board from "../../components/Board";
import Util from "../../services/util";
import {BoardLocation, Game} from "../../services/types/gamestate";

interface Props {
}

interface State {
}

class App extends Component<Props, State> {

    readonly game = new Game(Util.initialGame)

    makeMove = (from: BoardLocation, to: BoardLocation) => {
        this.game.makeMove(from, to)
    }

    render() {
        return (
            <div className={styles.backgroundDiv}>
                <div className={styles.foregroundDiv}>
                    <Board game={this.game} makeMove={this.makeMove}/>
                </div>
            </div>
        )
    }
}

export default App;