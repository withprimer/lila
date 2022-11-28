package lila.puzzle

import chess.format.Forsyth
import chess.format.UciCharPair
import play.api.libs.json._

import scala.concurrent.duration._
import lila.gamesForPuzzle.{ GameForPuzzle, GamesForPuzzleRepo }
import lila.i18n.defaultLang

import scala.collection.immutable.ArraySeq

final private class GamesForPuzzleJson(
    gamesForPuzzleRepo: GamesForPuzzleRepo,
    cacheApi: lila.memo.CacheApi,
    lightUserApi: lila.user.LightUserApi
)(implicit ec: scala.concurrent.ExecutionContext) {

  def apply(gameId: GameForPuzzle.ID, plies: Int, bc: Boolean): Fu[JsObject] =
    cache get writeKey(gameId)

  def noCacheBc(game: GameForPuzzle, plies: Int): Fu[JsObject] =
    lightUserApi preloadMany ArraySeq("example") map { _ =>
      generate(game, plies)
    }

  private def readKey(k: String): (GameForPuzzle.ID, Int) =
    k.drop(GameForPuzzle.gameIdSize).toIntOption match {
      case Some(ply) => (k take GameForPuzzle.gameIdSize, ply)
      case _         => sys error s"puzzle.GameJson invalid key: $k"
    }
  private def writeKey(id: GameForPuzzle.ID) = s"$id"

  private val cache = cacheApi[String, JsObject](4096, "puzzle.gameJson") {
    _.expireAfterAccess(5 minutes)
      .maximumSize(4096)
      .buildAsyncFuture(key =>
        readKey(key) match {
          case (id, plies) => generate(id, plies, false)
        }
      )
  }

//  private val bcCache = cacheApi[String, JsObject](64, "puzzle.bc.gameJson") {
//    _.expireAfterAccess(5 minutes)
//      .maximumSize(1024)
//      .buildAsyncFuture(key =>
//        readKey(key) match {
//          case (id, plies) => generate(id, plies, true)
//        }
//      )
//  }

  private def generate(gameId: GameForPuzzle.ID, plies: Int, bc: Boolean): Fu[JsObject] =
    gamesForPuzzleRepo gameFromSecondary gameId orFail s"Missing puzzle game $gameId!" map { game =>
      generate(game, plies)
    }

  private def generate(game: GameForPuzzle, plies: Int): JsObject =
    Json
      .obj(
        "id"    -> game.id,
        "moves" -> game.moves
      )

//  private def generateBc(game: Game, plies: Int): JsObject =
//    Json
//      .obj(
//        "id"      -> game.id,
//        "perf"    -> perfJson(game),
//        "players" -> playersJson(game),
//        "rated"   -> game.rated,
//        "treeParts" -> {
//          val pgnMoves = game.pgnMoves.take(plies + 1)
//          for {
//            pgnMove <- pgnMoves.lastOption
//            situation <- chess.Replay
//              .situations(pgnMoves, None, game.variant)
//              .valueOr { err =>
//                sys.error(s"GameJson.generateBc ${game.id} $err")
//              }
//              .lastOption
//            uciMove <- situation.board.history.lastMove
//          } yield Json.obj(
//            "fen" -> Forsyth.>>(situation).value,
//            "ply" -> (plies + 1),
//            "san" -> pgnMove,
//            "id"  -> UciCharPair(uciMove).toString,
//            "uci" -> uciMove.uci
//          )
//        }
//      )
//      .add("clock", game.clock.map(_.config.show))
}
