package lila.user

import org.specs2.mutable.Specification

class UserTest extends Specification {

  def canSignup(str: User.ID) =
    User.newUsernamePrefix.pattern.matcher(str).matches && User.newUsernameSuffix.pattern
      .matcher(str)
      .matches &&
      User.newUsernameChars.pattern.matcher(str).matches &&
      User.newUsernameLetters.pattern.matcher(str).matches

  "username regex" in {
    import User.couldBeUsername
    "alphanumeric, no other chars" in {
      couldBeUsername("abcde") must beTrue
      couldBeUsername("0fooo") must beTrue
      couldBeUsername("_fooo") must beFalse
      couldBeUsername("!fooo") must beFalse
      couldBeUsername("-fooo") must beFalse
    }
  }

}
