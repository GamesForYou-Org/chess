<template>
  <div>
    <ul>
      <li v-for="(piece, i) in getPieces()" :key="i">
        <img v-bind:src="getImage(piece)" @click="promote(piece)" />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { BoardPiece, PromoteConfig, Piece, PieceColor } from "../lib/ichess";
import ChessBoard from "./ChessBoard.vue";

@Options({
  props: {
    promoteConfig: {},
    chessBoard: {}
  }
})
export default class Promote extends Vue {
  promoteConfig!: PromoteConfig;
  chessBoard!: ChessBoard;

  getPieces(): Array<BoardPiece> {
    return this.promoteConfig.promoteOptions;
  }

  promote(bp: BoardPiece): void {
    this.promoteConfig.board.promote(bp, this.promoteConfig.to);
    console.log(this.chessBoard);
    this.chessBoard.promotionCompleted();
  }

  getImage(bp: BoardPiece): string {
    const images = require.context("../assets/", false, /\.png$/);
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
    return "";
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
div {
  position: absolute;
  z-index: 100;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: block;
  border: 1px solid wheat;
  background: #fff8dc;
}
img {
  width: 70px;
  height: 70px;
  padding: 10px;
}
</style>
