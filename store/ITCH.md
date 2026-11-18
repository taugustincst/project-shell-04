# itch.io page — Keep the Light

A draft for an itch.io page that hosts the free web part of the game and points
to the full game on Google Play. Nothing here is published; the steps below are
for Taylor to follow by hand.

The zip is built with the marketing tools, outside this repo:
`python3 tools/itch_pack.py <this repo> keepthelight-itch.zip` (index.html at
the root, plus `js/`, `icons/`, the stylesheet and the manifest; nothing from
`android/`, `tests/`, `sim/`, `tools/` or `store/`). In a plain browser the
build plays 1890 to the first bulb in 1930 and shows the rest of the century
as part of the Google Play edition, so the itch page works as a free demo.

## Upload

1. https://itch.io/game/new (a free account; verify the email first).
2. **Kind of project:** HTML. Upload `keepthelight-itch.zip` and tick
   **This file will be played in the browser**.
3. **Embed options:** viewport **360 × 640** (portrait); tick **Mobile
   friendly** (orientation: portrait) and **Fullscreen button**. Leave
   *Automatically start on page load* on. SharedArrayBuffer: off (not used).
4. **Pricing:** *No payments* (a free web demo; the full game is on Google Play).
5. **Visibility:** *Draft* until the page below is filled, then *Public*.

## Page

**Title** (the project name)

    Keep the Light

**Short description or tagline** (the line under the title)

    An idle lighthouse incremental with an ending. One light, one family, 1890 to 1990, a century in a keeper's logbook.

**Classification:** Games · **Kind of project:** HTML

**Genre:** Simulation (also Interactive Fiction)

**Tags** (ten at most; itch's own vocabulary)

    Incremental, Idle, Clicker, Narrative, Text based, Historical, Singleplayer, Relaxing, Atmospheric, Mobile

**Made with:** JavaScript, HTML5

**Languages:** English · **Inputs:** Mouse, Touchscreen

**Accessibility:** large text, high contrast and reduce motion, in the settings.

**Links:** the full game on Google Play:
https://play.google.com/store/apps/details?id=com.taugustincst.keepthelight

**Description** (itch takes Markdown)

    **100 years, one lighthouse.**

    You take charge of Carrow Point light in 1890 with four wicks, a
    clockwork, and oil in the store for eleven nights. Haul the oil up the
    stair, buy upgrades for the lamp, the stores, the keepers and the
    station, and watch a village grow because your light exists. A lifeboat
    station turns wrecks into rescues.

    **A story in a logbook.** The keepers write the log: storms, fog,
    inspectors, wars. Every event is a choice with a cost. The light keeps
    earning while you are away.

    **It ends.** The century closes in 1990 with one of three endings, and a
    new headland to keep after it.

    **This web version is the free part of the game:** 1890 to the first
    bulb in 1930. The full game, with the rest of the century, the three
    endings and three more headlands, is on Google Play:
    https://play.google.com/store/apps/details?id=com.taugustincst.keepthelight

    No ads, no account. Progress stays in your browser.

**Screenshots:** the raw phone shots in this folder (`screenshot-01-logbook.png`
to `screenshot-04-village.png`), or the captioned ones in `store/play/`.

**Cover image:** 630 × 500; crop `feature-graphic-1024x500.png` around the
lighthouse.
