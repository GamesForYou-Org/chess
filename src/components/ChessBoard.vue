<template>
  <div>
    <span>{{ board.isCheckMate() }}</span>
    <table cellspacing="0" cellpadding="0">
      <tr v-for="(row, r) in board.getBoard()" v-bind:key="r">
        <td v-for="(col, c) in row" v-bind:key="c" :class="getClass(r, c)">
          <span
            v-if="
              promoteConfig &&
                promoteConfig.to.row === r &&
                promoteConfig.to.column === c
            "
          >
            <Promote :promoteConfig="promoteConfig" :chessBoard="getSelf()" />
          </span>
          <span v-if="col !== null">
            <img
              v-bind:src="getImage(col)"
              draggable
              @dragstart="startDrag($event, r, c)"
              @drop="onDrop($event, r, c)"
              @dragover.prevent
              @dragenter.prevent
            />
          </span>
          <span v-else>
            <img
              src="../assets/empty.png"
              @drop="onDrop($event, r, c)"
              @dragover.prevent
              @dragenter.prevent
            />
          </span>
        </td>
      </tr>
    </table>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import Promote from "./Promote.vue";
import {
  Board,
  PieceColor,
  Piece,
  BoardPiece,
  Position,
  PromoteConfig
} from "../lib/ichess";

@Options({
  components: {
    Promote
  }
})
export default class ChessBoard extends Vue {
  board = new Board();
  promoteConfig: PromoteConfig | null = null;

  getSelf(): ChessBoard {
    return this;
  }

  getImage(bp: BoardPiece): string {
    const images = require.context("../assets/", false, /\.png$/);
    if (bp && bp.getPiece() === Piece.King) {
      if (bp.getPieceColor() === PieceColor.White) {
        return images("./whiteking.png");
      } else {
        return images("./blackking.png");
      }
    }
    if (bp && bp.getPiece() === Piece.Queen) {
      if (bp.getPieceColor() === PieceColor.White) {
        return images("./whitequeen.png");
      } else {
        return images("./blackqueen.png");
      }
    }
    if (bp && bp.getPiece() === Piece.Rook) {
      if (bp.getPieceColor() === PieceColor.White) {
        return images("./whiterook.png");
      } else {
        return images("./blackrook.png");
      }
    }
    if (bp && bp.getPiece() === Piece.Bishop) {
      if (bp.getPieceColor() === PieceColor.White) {
        return images("./whitebishop.png");
      } else {
        return images("./blackbishop.png");
      }
    }
    if (bp && bp.getPiece() === Piece.Knight) {
      if (bp.getPieceColor() === PieceColor.White) {
        return images("./whiteknight.png");
      } else {
        return images("./blackknight.png");
      }
    }

    if (bp.getPieceColor() === PieceColor.White) {
      return images("./whitepawn.png");
    }

    return images("./blackpawn.png");
  }
  getPiece(p: Piece): string {
    if (p === Piece.Rook) {
      return "R";
    }
    if (p === Piece.Queen) {
      return "Q";
    }
    if (p === Piece.King) {
      return "K";
    }
    if (p === Piece.Bishop) {
      return "B";
    }
    if (p === Piece.Knight) {
      return "N";
    }
    return "P";
  }
  getColor(c: PieceColor): string {
    return c === PieceColor.White ? "W" : "B";
  }
  getClass(row: number, col: number): string {
    if (row % 2 === 0) {
      if (col % 2 === 0) {
        return "whiteClass";
      } else {
        return "blackClass";
      }
    } else {
      if (col % 2 === 0) {
        return "blackClass";
      } else {
        return "whiteClass";
      }
    }
  }

  startDrag(evt: DragEvent, fromRow: number, fromCol: number): void {
    if (evt && evt.dataTransfer) {
      console.log("Draggig from " + fromRow + " " + fromCol);

      evt.dataTransfer.dropEffect = "move";
      evt.dataTransfer.effectAllowed = "move";
      evt.dataTransfer.setData("fromRow", fromRow + "");
      evt.dataTransfer.setData("fromCol", fromCol + "");
    }
  }

  onDrop(evt: DragEvent, toRow: number, toCol: number): void {
    if (evt && evt.dataTransfer) {
      console.log("dropping into " + toRow + " " + toCol);
      const fromRow: number = +evt.dataTransfer.getData("fromRow");
      const fromCol: number = +evt.dataTransfer.getData("fromCol");

      const from = new Position(fromRow, fromCol);
      const to = new Position(toRow, toCol);
      const moveOutput = this.board.move(from, to);
      if (moveOutput.promoteOptions) {
        this.promoteConfig = {
          to: to,
          promoteOptions: moveOutput.promoteOptions,
          board: this.board
        };
      }
    }
  }

  promotionCompleted(): void {
    this.promoteConfig = null;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
table {
  border: none;
}
td {
  width: 60px;
  height: 60px;
}
img {
  width: 40px;
  height: 40px;
  padding: 10px;
}
.empty {
  width: 60px;
  height: 60px;
}
.whiteClass {
  background: #f1c27d;
}
.blackClass {
  background: #c68642;
}
</style>
