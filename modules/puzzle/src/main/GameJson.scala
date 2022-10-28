package lila.puzzle

import chess.format.Forsyth
import chess.format.UciCharPair
import play.api.libs.json._

import scala.concurrent.duration._
import lila.game.{Game, GameRepo, PerfPicker}
import lila.i18n.defaultLang
import play.api.mvc.Results

import scala.concurrent.Future

final private class GameJson(
    gameRepo: GameRepo,
    cacheApi: lila.memo.CacheApi,
    lightUserApi: lila.user.LightUserApi,
    retrieveGameApi: lila.puzzle.RetrieveGameApi
)(implicit ec: scala.concurrent.ExecutionContext) {

  def apply(gameId: Game.ID, plies: Int, bc: Boolean): Fu[JsObject] =
    (if (bc) bcCache else cache) get writeKey(gameId, plies)

  def noCacheBc(game: Game, plies: Int): Fu[JsObject] =
    lightUserApi preloadMany game.userIds map { _ =>
      generateBc(game, plies)
    }

  private def readKey(k: String): (Game.ID, Int) =
    k.drop(Game.gameIdSize).toIntOption match {
      case Some(ply) => (k take Game.gameIdSize, ply)
      case _         => sys error s"puzzle.GameJson invalid key: $k"
    }
  private def writeKey(id: Game.ID, ply: Int) = s"$id$ply"

  private val cache = cacheApi[String, JsObject](4096, "puzzle.gameJson") {
    _.expireAfterAccess(5 minutes)
      .maximumSize(4096)
      .buildAsyncFuture(key =>
        readKey(key) match {
          case (id, plies) => generate(id, plies, false)
        }
      )
  }

  private val bcCache = cacheApi[String, JsObject](64, "puzzle.bc.gameJson") {
    _.expireAfterAccess(5 minutes)
      .maximumSize(1024)
      .buildAsyncFuture(key =>
        readKey(key) match {
          case (id, plies) => generate(id, plies, true)
        }
      )
  }
//
//  /**
//    * Returns the text (content) from a URL as a String.
//    * Warning: This method does not time out when the service is non-responsive.
//    */
//  def get(url: String): String = scala.io.Source.fromURL(url).mkString
//  private def generateFromLichessAPI(gameId: Game.ID, plies: Int, bc: Boolean): Fu[JsObject] =
//    HttpRequest(
//      method = HttpMethods.POST,
//      uri = endpoint,
//      entity = HttpEntity(ContentTypes.`application/json`, example.toJson.toString),
//      headers = Seq()
//    );
//    }
  private def generate(gameId: Game.ID, plies: Int, bc: Boolean): Fu[JsObject] = {
    printf("!!! TESTING")
//    printf(retrieveGameApi.retrieveGames(gameId))
    // .dmap { pgn =>
    //   printf("!!! PGN %s", pgn)
    // }

//  val pgn: Future[String] = for {
//    pgn <-
//  } yield pgn
  val pgn = retrieveGameApi.retrieveGames(gameId).await(3 seconds, "gameRetrieved")
  printf("!!! PGN %s", pgn)

    printf("!!! END OF FUNC")
    gameRepo gameFromSecondary gameId orFail s"Missing puzzle game $gameId!" flatMap { game =>
      lightUserApi preloadMany game.userIds map { _ =>
        if (bc) generateBc(game, plies)
        else generate(game, plies)
      }
    }
  }

  private def generate(game: Game, plies: Int): JsObject =
    Json
      .obj(
        "id"      -> game.id,
        "perf"    -> perfJson(game),
        "rated"   -> game.rated,
        "players" -> playersJson(game),
        "pgn"     -> game.chess.pgnMoves.take(plies + 1).mkString(" ")
      )
      .add("clock", game.clock.map(_.config.show))

  private def perfJson(game: Game) = {
    val perfType = lila.rating.PerfType orDefault PerfPicker.key(game)
    Json.obj(
      "icon" -> perfType.iconChar.toString,
      "name" -> perfType.trans(defaultLang)
    )
  }

  private def playersJson(game: Game) = JsArray(game.players.map { p =>
    val userId = p.userId | "anon"
    val user   = lightUserApi.syncFallback(userId)
    Json
      .obj(
        "userId" -> userId,
        "name"   -> s"${user.name}${p.rating.??(r => s" ($r)")}",
        "color"  -> p.color.name
      )
      .add("title" -> user.title)
  })

  private def generateBc(game: Game, plies: Int): JsObject =
    Json
      .obj(
        "id"      -> game.id,
        "perf"    -> perfJson(game),
        "players" -> playersJson(game),
        "rated"   -> game.rated,
        "treeParts" -> {
          val pgnMoves = game.pgnMoves.take(plies + 1)
          for {
            pgnMove <- pgnMoves.lastOption
            situation <- chess.Replay
              .situations(pgnMoves, None, game.variant)
              .valueOr { err =>
                sys.error(s"GameJson.generateBc ${game.id} $err")
              }
              .lastOption
            uciMove <- situation.board.history.lastMove
          } yield Json.obj(
            "fen" -> Forsyth.>>(situation).value,
            "ply" -> (plies + 1),
            "san" -> pgnMove,
            "id"  -> UciCharPair(uciMove).toString,
            "uci" -> uciMove.uci
          )
        }
      )
      .add("clock", game.clock.map(_.config.show))
}
