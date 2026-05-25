# xq-parser

---

An extensible parser framework for everything in the XQuery / XPath family. With vendor-specific extensions. Implements both XQuery 3.1 and XQuery 4.

Based on the amazing [Rex parser generator](https://github.com/GuntherRademacher/rex-parser-generator).

| Vendor | Specification | Implementation state |
|-----|-----|-----|
| Exist-DB | [XQuery Update extension](https://exist-db.org/exist/apps/doc/update_ext)  | Implemented in both XQuery 3 and 4. Sponsored by [Exist Solutions](https://www.existsolutions.com/) ![Exist Solutions logo](https://www.existsolutions.com/resources/images/existsolutions-logo.svg)  |
| XQuery Update Facility   | [XQUF 30](https://www.w3.org/TR/xquery-update-30)   | Implemented, experimental in XQuery 4. Open for sponsorship  |
| BaseX   | [XQuery Extensions](https://docs.basex.org/main/XQuery_Extensions)   | Not implemented. Open for sponsorship  |
| MarkLogic   | [MarkLogic Server Enhanced XQuery Language](https://docs.marklogic.com/9.0/guide/xquery/enhanced)   | Not implemented. Open for sponsorship  |

## Regenerating the parsers

The parsers in `parsers/XQuery-40-full.ts` and `parsers/XQuery-31-full.ts` are generated from EBNF grammars using the [REx parser generator](https://github.com/GuntherRademacher/rex-parser-generator). The raw grammars live in `rawgrammars/` and the transformation pipeline lives in `src/`.

### Steps to regenerate

1. **Clone and build REx** (requires `g++`):
   ```sh
   git clone https://github.com/GuntherRademacher/rex-parser-generator.git
   cd rex-parser-generator
   rex/scripts/build-gpp.sh
   cd ..
   ```

2. **Run the generator script** from the repo root:
   ```sh
   ./generate-parsers.sh
   ```
   This script:
   - Transforms `rawgrammars/XQuery-40.ebnf` → `transformedgrammars/XQuery-40-full.ebnf` (applying XQUF and eXist-DB mutations via `src/index.ts`)
   - Runs `rex -typescript -glalr 1 -a pi -tree` on each transformed grammar
   - Prepends `parser_header.txt` and writes the result to `parsers/`

3. **Verify** by running the test suite:
   ```sh
   npm test
   # or, with the W3C conformance tests:
   QT4_TESTS_DIR=qt4tests npm test
   ```

### Updating the raw grammar

The XQuery 4.0 raw grammar is periodically refreshed from the upstream REx sample:
```
https://raw.githubusercontent.com/GuntherRademacher/rex-parser-generator/main/docs/sample-grammars/XQuery-40.ebnf
```

A CI workflow (`update-xquery-4-ebnf.yml`) can be triggered manually via `workflow_dispatch` to download the latest grammar, apply the transformations, run REx, and open a pull request with the result.

The XQuery 3.1 grammar (`rawgrammars/XQuery-31.ebnf`) is maintained manually.
