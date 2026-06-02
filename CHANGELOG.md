# Changelog

## [0.6.0](https://github.com/DrRataplan/xq-parser/compare/xq-parser-v0.5.1...xq-parser-v0.6.0) (2026-06-02)


### Features

* **parser:** update parser to the newest spec ([df02bc9](https://github.com/DrRataplan/xq-parser/commit/df02bc9c09e29ab013e5ed2d9d8c8c5af36f30de))


### Bug Fixes

* **ci:** fix qt4-update workflow branch name and permissions ([0b37a5d](https://github.com/DrRataplan/xq-parser/commit/0b37a5d6a66b54fdc1daf494596db3dcb1d268db))
* **ci:** fix REx flags, output path, header prepend, and add PR creation ([0b25c7a](https://github.com/DrRataplan/xq-parser/commit/0b25c7ac968777c38bec737cd65aafb53479c10f))
* **ci:** fix YAML error from colon in pr create title ([55622c7](https://github.com/DrRataplan/xq-parser/commit/55622c7bc08e0e734051f5a5b8891874b04f3e04))

## [0.5.1](https://github.com/DrRataplan/xq-parser/compare/xq-parser-v0.5.0...xq-parser-v0.5.1) (2026-05-29)


### Bug Fixes

* add repository url to package.json for npm provenance publishing ([#10](https://github.com/DrRataplan/xq-parser/issues/10)) ([f06a83f](https://github.com/DrRataplan/xq-parser/commit/f06a83f3eb7db726c01c7d557f7feede972a1b28))

## [0.5.0](https://github.com/DrRataplan/xq-parser/compare/xq-parser-v0.4.0...xq-parser-v0.5.0) (2026-05-29)


### Features

* **comments:** process internally in here ([e86abaf](https://github.com/DrRataplan/xq-parser/commit/e86abaf84ec8bbe49710691de0104fc6152513ac))
* **exist-db:** add exist-db mutations for update node syntax ([7a4746f](https://github.com/DrRataplan/xq-parser/commit/7a4746f2f13310981ed5f8c3c235fc13dc74b5ce))
* **test:** add QT4 parser conformance tests ([cbd16bc](https://github.com/DrRataplan/xq-parser/commit/cbd16bc2719ac69611871495976fbd62c55e0ab9))
* **types:** export Terminal/NonTerminal types ([e3ae3ce](https://github.com/DrRataplan/xq-parser/commit/e3ae3ce028e67a052d3a5dd8d0ed6611088c82b4))


### Bug Fixes

* allow replace/insert/delete/rename as function names in XQUF grammars ([6320411](https://github.com/DrRataplan/xq-parser/commit/63204115cf0d16326b4b513d39306871e0a74e4c))
* **ci:** checkout PR head instead of merge commit, guard against missing submodule ([7f842d2](https://github.com/DrRataplan/xq-parser/commit/7f842d256a3f3d864efef47edce7f55cc33f1310))
* **errors:** throw pretty syntax errors when something breaks ([5d99d22](https://github.com/DrRataplan/xq-parser/commit/5d99d22cd7e7dd2d90b581f3c38bc2cc7e3d838f))
* **parser:** update XQ40 grammar to upstream and fix 187 conformance failures ([3aa885f](https://github.com/DrRataplan/xq-parser/commit/3aa885f268fb7256cabfc988ed946994fa421943))
* **parsing:** use generated parsetreebuilder to generate parse tree ([57bcd1f](https://github.com/DrRataplan/xq-parser/commit/57bcd1f6a345f250b94267c5e9c7f85d09d3951f))
* **test:** drop --experimental-strip-types, rename outcomes to parse-failed/parse-succeeded ([eeaf4f3](https://github.com/DrRataplan/xq-parser/commit/eeaf4f3b671dfbe17cf518c3a7697d36eb028bdc))
