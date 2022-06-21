package views.html.challenge

import lila.api.Context
import lila.app.templating.Environment.{embedJsUnsafeLoadThen, jsModule}
import lila.app.ui.ScalatagsTemplate.{frag, main}

object iframeApi {
  def apply()(implicit ctx: Context) = {
    views.html.base.layout(
      title = "iframe",
      moreJs = frag(
        jsModule("challenge.iframe"),
        embedJsUnsafeLoadThen(s"""LichessChallengeIframeAPI.setup()""")
      )
    ) {
      main()
    }
  }
}
