package lila.puzzle

import lila.base.LilaException
import play.api.libs.json._
import play.api.libs.ws.StandaloneWSClient
import reactivemongo.api.ReadPreference
import play.api.libs.ws.JsonBodyReadables._

import scala.concurrent.duration._
import lila.common.Domain
import lila.db.dsl._
import lila.game.Game

final class RetrieveGameApi(
    ws: StandaloneWSClient,
)(implicit
    ec: scala.concurrent.ExecutionContext
) {

  def retrieveGames(gameId: String): Fu[String] =
    ws.url(s"https://lichess.org/game/export/${gameId}")
      .withHttpHeaders(
        "Accept" -> "application/json"
      )
      .get()
      .map {
        case res if res.status == 200 =>
          (res.body[JsValue] \ "pgn").as[String]
        case res => throw new RuntimeException(s"Error fetching game ${res}")
      }
}
//      .monTry(res => _.security.checkMailApi.fetch(res.isSuccess, res.getOrElse(true)))

//  private def fetch(domain: Domain.Lower): Fu[Boolean] =
//    ws.url(config.url)
//      .withQueryStringParameters("domain" -> domain.value, "disable_test_connection" -> "true")
//      .get()
//      .withTimeout(15.seconds)
//      .map {
//        case res if res.status == 200 =>
//          val readBool   = readRandomBoolean(res.body[JsValue]) _
//          val valid      = readBool("valid")
//          val block      = readBool("block")
//          val disposable = readBool("disposable")
//          val reason     = ~(res.body[JsValue] \ "reason").asOpt[String]
//          val ok         = valid && !block && !disposable
//          logger.info(s"CheckMail $domain = $ok ($reason) {valid:$valid,block:$block,disposable:$disposable}")
//          ok
//        case res =>
//          throw lila.base.LilaException(s"${config.url} $domain ${res.status} ${res.body take 200}")
//      }
//      .monTry(res => _.security.checkMailApi.fetch(res.isSuccess, res.getOrElse(true)))
//}
