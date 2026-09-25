# Third-party notices

## Y sequence, ω-Y sequence

The 1-Y sequence (Y 数列) and the ω-Y sequence were made by ゆきと (Yukito):
[Y数列](https://googology.fandom.com/ja/wiki/%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC%E3%83%96%E3%83%AD%E3%82%B0:%E3%82%86%E3%81%8D%E3%81%A8/Y%E6%95%B0%E5%88%97).

## YNySequence, StudyAndExpandSequence, MEGAwhYmountain (Naruyoko)

These programs by Naruyoko are used and adapted with the author's own permission
(独自許可). They are not under the MIT License of mt-swiper.

| file | adapted from | changes |
|---|---|---|
| `yny.js` | [YNySequence](https://naruyoko.github.io/googology/YNySequence/) (1-Y) | wrapped in a module object; the page UI (form, url state, `window.onload`, `window.onerror`) is removed; the algorithm is unchanged |
| `omegay.js` | [StudyAndExpandSequence](https://naruyoko.github.io/googology/StudyAndExpandSequence/) (ω-Y) | wrapped in a module object; the page UI (form, random generation, `window.onload`, `window.onerror`) and the writes of debug text into the page are removed; the algorithm is unchanged |
| `draw.js` | [MEGAwhYmountain](https://naruyoko.github.io/googology/MEGAwhYmountain/) (drawing) | the layout of its stack mode (rows stacked from the highest, columns in place, the leg lines, the divider lines at a new ω level) is rewritten for a list of columns with fixed sizes; the option sliders are not reproduced; the bad part band and the marks are added; every ω-level layer above the first gets a bottom row that copies the tops below it (built in `system.js`) |

## weak-magma ω-Y (Phyrion, Apache-2.0)

`wmwy.js` is a JavaScript translation of `OmegaY/Rows.lean`,
`OmegaY/Canonical/Build.lean` and `OmegaY/Expansion/Build.lean` of
[Phyrion1343/omega-Y-Well-Ordering-Lean](https://github.com/Phyrion1343/omega-Y-Well-Ordering-Lean)
(revision `33c16a8`), licensed under the Apache License, Version 2.0.
`wmwy.js` stays under the Apache License, Version 2.0: see [LICENSE-APACHE](LICENSE-APACHE)
and [NOTICE](NOTICE), which also lists the changes.

## BMSHydraViewer (Naruyoko, MIT)

The bad root mark and the cut mark in `draw.js` are the symbols of
[hydraswipe](https://github.com/koteitan/hydraswipe), which took them from
[BMSHydraViewer](https://github.com/Naruyoko/BMSHydraViewer) by Naruyoko,
used under the MIT License:

```
MIT License

Copyright (c) 2019 Naruyoko

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
