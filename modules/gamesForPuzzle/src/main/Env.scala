package lila.gamesForPuzzle

import com.softwaremill.macwire._
import play.api.Configuration

import lila.common.config.CollName

@Module
final class Env(
    appConfig: Configuration,
    userRepo: lila.user.UserRepo,
//    gamesForPuzzleRepo: lila.gamesForPuzzle.GamesForPuzzleRepo,
    db: lila.db.Db,
    cacheApi: lila.memo.CacheApi
)(implicit ec: scala.concurrent.ExecutionContext, mode: play.api.Mode) {

//  lazy val gamesForPuzzle = db(
//    CollName(appConfig.get[String]("gamesForPuzzle.collection.games_for_puzzle"))
//  )

  lazy val gamesForPuzzleRepo = new GamesForPuzzleRepo(db(CollName("games_for_puzzle")))
}
