package lila.gamesForPuzzle

import scala.concurrent.duration._

import chess.format.{ FEN, Forsyth }
import chess.{ Color, Status }
import org.joda.time.DateTime
import reactivemongo.akkastream.{ cursorProducer, AkkaStreamCursor }
import reactivemongo.api.commands.WriteResult
import reactivemongo.api.{ Cursor, ReadPreference, WriteConcern }

import lila.common.ThreadLocalRandom
import lila.db.BSON.BSONJodaDateTimeHandler
import lila.db.dsl._
import lila.db.isDuplicateKey
import lila.user.User

final class GamesForPuzzleRepo(val coll: Coll)(implicit ec: scala.concurrent.ExecutionContext) {
  import GameForPuzzle.{ BSONFields => F, ID }

  def game(gameId: ID): Fu[Option[GameForPuzzle]] = coll.byId[GameForPuzzle](gameId)
}
