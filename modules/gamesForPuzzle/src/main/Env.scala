package lila.gamesForPuzzle

import com.softwaremill.macwire._
import play.api.Configuration

import lila.common.config.CollName

@Module
final class Env(
    appConfig: Configuration,
    reporter: lila.hub.actors.Report,
    userRepo: lila.user.UserRepo,
    noteApi: lila.user.NoteApi,
    lightUser: lila.common.LightUser.Getter,
    db: lila.db.Db,
    cacheApi: lila.memo.CacheApi
)(implicit ec: scala.concurrent.ExecutionContext, mode: play.api.Mode) {

  lazy val gamesForPuzzle = db(
    CollName(appConfig.get[String]("gamesForPuzzle.collection.games_for_puzzle"))
  )
}
