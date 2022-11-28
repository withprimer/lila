package lila.gamesForPuzzle

import chess.Color.{ Black, White }
import chess.format.{ FEN, Uci }
import chess.opening.{ FullOpening, FullOpeningDB }
import chess.variant.{ FromPosition, Standard, Variant }
import chess.{ Castles, Centis, CheckCount, Clock, Color, Game => ChessGame, Mode, MoveOrDrop, Speed, Status }
import org.joda.time.DateTime

import lila.common.Sequence
import lila.db.ByteArray
import lila.rating.PerfType
import lila.rating.PerfType.Classical
import lila.user.User

case class GameForPuzzle(
    id: GameForPuzzle.ID,
    moves: String
) {}

object GameForPuzzle {

  import lila.db.BSON
  import reactivemongo.api.bson._

  type ID    = String
  type moves = String

  implicit val gamesForPuzzleBSONHandler = new BSON[GameForPuzzle] {

    def reads(r: BSON.Reader) =
      GameForPuzzle(
        id = r str "_id",
        moves = r str "moves"
      )

    def writes(w: BSON.Writer, g: GameForPuzzle) =
      BSONDocument(
        "_id"   -> g.id,
        "moves" -> g.moves
      )
  }

  val gameIdSize = 8

  val unplayedHours = 24

  def takeGameId(fullId: String) = fullId take gameIdSize

  def takePlayerId(fullId: String) = fullId drop gameIdSize

  val idRegex = """[\w-]{8}""".r

  def validId(id: ID) = idRegex matches id

//  def make(
//      chess: ChessGame
//  ): GameForPuzzle = {
//    val createdAt = DateTime.now
//    GameForPuzzle(
//      id = IdGenerator.uncheckedGame,
//      whitePlayer = whitePlayer,
//      blackPlayer = blackPlayer,
//      chess = chess,
//      status = Status.Created,
//      daysPerTurn = daysPerTurn,
//      mode = mode,
//      metadata = metadata(source).copy(pgnImport = pgnImport),
//      createdAt = createdAt,
//      movedAt = createdAt
//    )
//  }

  object BSONFields {

    val id    = "_id"
    val moves = "moves"

  }
}
