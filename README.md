# mt-swiper

Swipe-driven Y-mountain viewer and expander for phones, for three sequence systems:

- 1-Y (the Y sequence), expanded by [YNySequence](https://naruyoko.github.io/googology/YNySequence/)
- ω-Y, expanded by [StudyAndExpandSequence](https://naruyoko.github.io/googology/StudyAndExpandSequence/)
- weak-magma ω-Y, expanded by a JavaScript translation of the Lean definition in [Phyrion1343/omega-Y-Well-Ordering-Lean](https://github.com/Phyrion1343/omega-Y-Well-Ordering-Lean)

The mountains are drawn in the stack layout of [MEGAwhYmountain](https://naruyoko.github.io/googology/MEGAwhYmountain/). The UI follows [hydraswipe](https://github.com/koteitan/hydraswipe).

## Use

Every line of the text is one sequence, such as `(1,3,3)`, and gets its own image. The swipes act on the focused image (outlined when there are several); tap an image to focus it.

- swipe right: append the largest term that keeps the sequence standard (the empty sequence becomes (1), and (1) becomes (1,L))
- swipe left: delete the last term
- swipe up: the last term becomes the next larger standard term below (1,L+1); so (1,L) goes up only after `+`
- swipe down: the last term becomes the next smaller standard term
- the `- L +` buttons in the header: the level L. The swipes stay below (1,L+1). `-` turns a sequence at or above (1,L+1) into (1,L). Typing a sequence sets L to its second term.
- double tap: the text box appears. Type sequences, one per line; the images follow while typing. The line of the caret is the focused image. OK closes the box.
- expand: inserts X[1], X[2], X[3], ... one by one under the line X of the caret. Pressing it again continues with the same X; editing the text or moving the caret starts again from the caret line.

Cursor keys or w/a/s/d do the swipes on a PC, and `+` / `-` keys do the level buttons.

The menu (top right) chooses the theme (system by default, light, dark) and the sequence system (1-Y by default, ω-Y, weak-magma ω-Y).

"Standard" means reachable from (1,L+1) by expansions and by taking prefixes. It is decided by going down from (1,L+1): expand with the bracket that just reaches the needed length, and cut just after the first term above the target. This relies on X[n] being a prefix of X[n+1], which was checked on 400 sequences of each system.

The layers are separated by lines, as in MEGAwhYmountain. In 1-Y, the layer above a mountain is the mountain of its diagonal (the top node of every column, as `calcDiagonal` of YNySequence gives it, the sequence YNySequence climbs to find the bad root); the layers stop at a layer of one row. In ω-Y and weak-magma ω-Y the layers are the ω-levels of the rows, and, as in 1-Y, the bottom row of every layer above the first copies the top node below it in each column; the legs that enter a layer (all from its lowest row of differences, onto top nodes below) are drawn to these copies.

In the image, the columns from the bad root to the one before the last are the bad part (band), the red zigzag marks the bad root column and the red cross the last column. `(🚨 non-standard)` appears under a sequence that is not standard.

## Credits and licenses

- Y sequence and ω-Y sequence: ゆきと, [Y数列](https://googology.fandom.com/ja/wiki/%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC%E3%83%96%E3%83%AD%E3%82%B0:%E3%82%86%E3%81%8D%E3%81%A8/Y%E6%95%B0%E5%88%97)
- `yny.js`, `omegay.js`, `draw.js`: adapted from YNySequence, StudyAndExpandSequence and MEGAwhYmountain by Naruyoko, with the author's own permission
- `wmwy.js`: translated from Phyrion's Lean code, Apache License 2.0 ([LICENSE-APACHE](LICENSE-APACHE), [NOTICE](NOTICE))
- the rest: MIT License ([LICENSE](LICENSE)), koteitan

Details and changes: [THIRD-PARTY.md](THIRD-PARTY.md).
