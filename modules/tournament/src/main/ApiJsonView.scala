package lila.tournament

import play.api.i18n.Lang
import play.api.libs.json._
import lila.common.Json.jodaWrites
import lila.common.{Preload, Uptime}
import lila.game.Game
import lila.rating.PerfType
import lila.user.{LightUserApi, User}

final class ApiJsonView(cached: Cached,
                        lightUserApi: LightUserApi,
                        pairingRepo: PairingRepo,
                        duelStore: DuelStore,
                        pause: Pause,
                        playerRepo: PlayerRepo)(implicit ec: scala.concurrent.ExecutionContext) {

  import JsonView._
  import Condition.JSONHandlers._

  def apply(tournaments: VisibleTournaments)(implicit lang: Lang): Fu[JsObject] = this.apply(tournaments, None)

  def apply(tournaments: VisibleTournaments, me: Option[User] = None)(implicit lang: Lang): Fu[JsObject] =
    for {
      created  <- tournaments.created.map(tour => fullJson(tour, me)).sequenceFu
      started  <- tournaments.started.map(tour => fullJson(tour, me)).sequenceFu
      finished <- tournaments.finished.map(tour => fullJson(tour, me)).sequenceFu
    } yield Json.obj(
      "created"  -> created,
      "started"  -> started,
      "finished" -> finished
    )

  def featured(tournaments: List[Tournament])(implicit lang: Lang): Fu[JsObject] =
    tournaments.map(tour => fullJson(tour, None)).sequenceFu map { objs =>
      Json.obj("featured" -> objs)
    }

  def calendar(tournaments: List[Tournament])(implicit lang: Lang): JsObject =
    Json.obj(
      "since"       -> tournaments.headOption.map(_.startsAt.withTimeAtStartOfDay),
      "to"          -> tournaments.lastOption.map(_.finishesAt.withTimeAtStartOfDay plusDays 1),
      "tournaments" -> JsArray(tournaments.map(baseJson))
    )

  private def baseJson(tour: Tournament)(implicit lang: Lang): JsObject =
    Json
      .obj(
        "id"        -> tour.id,
        "createdBy" -> tour.createdBy,
        "system"    -> "arena", // BC
        "minutes"   -> tour.minutes,
        "clock"     -> tour.clock,
        "rated"     -> tour.mode.rated,
        "fullName"  -> tour.name(),
        "nbPlayers" -> tour.nbPlayers,
        "variant" -> Json.obj(
          "key"   -> tour.variant.key,
          "short" -> tour.variant.shortName,
          "name"  -> tour.variant.name
        ),
        "startsAt"   -> tour.startsAt,
        "finishesAt" -> tour.finishesAt,
        "status"     -> tour.status.id,
        "perf"       -> perfJson(tour.perfType),
        "description" -> tour.description
      )
      .add("secondsToStart", tour.secondsToStart.some.filter(0 <))
      .add("hasMaxRating", tour.conditions.maxRating.isDefined) // BC
      .add[Condition.RatingCondition]("maxRating", tour.conditions.maxRating)
      .add[Condition.RatingCondition]("minRating", tour.conditions.minRating)
      .add("private", tour.isPrivate)
      .add("position", tour.position.map(positionJson))
      .add("schedule", tour.schedule map scheduleJson)
      .add(
        "teamBattle",
        tour.teamBattle.map { battle =>
          Json.obj(
            "teams"     -> battle.teams,
            "nbLeaders" -> battle.nbLeaders
          )
        }
      )

  def fullJson(tour: Tournament)(implicit lang: Lang): Fu[JsObject] = this.fullJson(tour, None)

  def fullJson(tour: Tournament, me: Option[User] = None)(implicit lang: Lang): Fu[JsObject] = {
    for {
      myInfo <- Preload.none.orLoad(me ?? {
        fetchMyInfo(tour, _)
      })
      pauseDelay = me flatMap { u =>
        pause.remainingDelay(u.id, tour)
      }
      winner <- (tour.winnerId ?? lightUserApi.async)
    } yield {
      baseJson(tour)
        .add("me" -> myInfo.map(myInfoJson(me, pauseDelay)))
        .add("winner" -> winner.map(userJson))
    }
  }

  private def userJson(u: lila.common.LightUser) =
    Json.obj(
      "id"    -> u.id,
      "name"  -> u.name,
      "title" -> u.title
    )

  private val perfPositions: Map[PerfType, Int] = {
    import PerfType._
    List(Bullet, Blitz, Rapid, Classical, UltraBullet) ::: variants
  }.zipWithIndex.toMap

  private def perfJson(p: PerfType)(implicit lang: Lang) =
    Json
      .obj(
        "key"      -> p.key,
        "name"     -> p.trans,
        "position" -> ~perfPositions.get(p)
      )
      .add("icon" -> mobileBcIcons.get(p)) // mobile BC only

  // ----
  // copied over from JsonView.scala
  private def myInfoJson(u: Option[User], delay: Option[Pause.Delay])(i: MyInfo) =
    Json
      .obj("rank" -> i.rank)
      .add("withdraw", i.withdraw)
      .add("gameId", i.gameId)
      .add("pauseDelay", delay.map(_.seconds))

  def fetchMyInfo(tour: Tournament, me: User): Fu[Option[MyInfo]] =
    playerRepo.find(tour.id, me.id) flatMap {
      _ ?? { player =>
        fetchCurrentGameId(tour, me) flatMap { gameId =>
          getOrGuessRank(tour, player) dmap { rank =>
            MyInfo(rank + 1, player.withdraw, gameId, player.team).some
          }
        }
      }
    }

  private def fetchCurrentGameId(tour: Tournament, user: User): Fu[Option[Game.ID]] =
    if (Uptime.startedSinceSeconds(60)) fuccess(duelStore.find(tour, user))
    else pairingRepo.playingByTourAndUserId(tour.id, user.id)

  // if the user is not yet in the cached ranking,
  // guess its rank based on other players scores in the DB
  private def getOrGuessRank(tour: Tournament, player: Player): Fu[Int] =
    cached ranking tour flatMap {
      _.ranking get player.userId match {
        case Some(rank) => fuccess(rank)
        case None       => playerRepo.computeRankOf(player)
      }
    }

}
