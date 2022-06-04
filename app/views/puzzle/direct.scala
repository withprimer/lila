package views.html.puzzle

import controllers.routes
import play.api.libs.json.{ JsObject, Json }

import lila.api.Context
import lila.app.templating.Environment._
import lila.app.ui.ScalatagsTemplate._
import lila.common.String.html.safeJsonValue

object direct {
  def apply(
      puzzle: lila.puzzle.Puzzle,
      data: JsObject,
      pref: JsObject,
      difficulty: Option[lila.puzzle.PuzzleDifficulty] = None
  )(implicit ctx: Context) = {
    val isStreak = data.value.contains("streak")
    views.html.base.layout(
      title = if (isStreak) "Puzzle Streak" else trans.puzzles.txt(),
      moreCss = frag(
        cssTag("puzzle.direct"),
      ),
      moreJs = frag(
        jsModule("puzzle.direct"),
        embedJsUnsafeLoadThen(s"""LichessPuzzleDirect(${safeJsonValue(
            Json
              .obj(
                "data"        -> data,
                "pref"        -> pref,
                "i18n"        -> bits.jsI18n(streak = isStreak),
                "showRatings" -> ctx.pref.showRatings
              )
              .add("themes" -> ctx.isAuth.option(bits.jsonThemes))
              .add("difficulty" -> difficulty.map(_.key))
          )})""")
      ),
      csp = defaultCsp.withWebAssembly.withAnyWs.some,
      chessground = false,
      zoomable = false,
      playing = true
    ) {
      main(cls := "puzzle")(
        div(cls := "puzzle__board main-board")(chessgroundBoard),
      )
    }
  }
}
