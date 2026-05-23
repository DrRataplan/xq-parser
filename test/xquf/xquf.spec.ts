import { describe, it } from 'node:test';
import parsers from '../../parsers/index.ts';
import assert from 'node:assert';
describe('XQuery Update Facility', () => {
	describe('Examples from the docs', () => {
		const examplesFromDocs = [
			`declare %updating function
   upsert($e as element(),
          $an as xs:QName,
          $av as xs:anyAtomicType)
   {
   let $ea := $e/attribute()[fn:node-name(.) = $an]
   return
      if (fn:empty($ea))
      then insert node attribute {$an} {$av} into $e
      else replace value of node $ea with $av
};
()`,
			`insert node <year>2005</year>
after fn:doc("bib.xml")/books/book[1]/publisher`,
			`insert node $new-police-report
   as last into fn:doc("insurance.xml")/policies
      /policy[id = $pid]
      /driver[license = $license]
      /accident[date = $accdate]
/police-reports`,
			`delete node fn:doc("bib.xml")/books/book[1]/author[last()]
`,
			`delete nodes /email/message
[fn:currentDate() - date > xs:dayTimeDuration("P365D")]`,
			`replace node fn:doc("bib.xml")/books/book[1]/publisher
with fn:doc("bib.xml")/books/book[2]/publisher`,
			`replace value of node fn:doc("bib.xml")/books/book[1]/price
with fn:doc("bib.xml")/books/book[1]/price * 1.1`,
			`rename node fn:doc("bib.xml")/books/book[1]/author[1]
as "principal-author"`,
			`rename node fn:doc("bib.xml")/books/book[1]/author[1]
as $newname`,
			`for $node in $root//abc:*
let $localName := fn:local-name($node),
    $newQName := fn:concat("xyz:", $localName)
return (
   rename node $node as fn:QName("http://xyz/ns", $newQName),
   for $attr in $node/@abc:*
   let $attrLocalName := fn:local-name($attr),
       $attrNewQName := fn:concat("xyz:", $attrLocalName)
   return
      rename node $attr as fn:QName("http://xyz/ns", $attrNewQName)
)`,
			`let $f := fn:put#2
return invoke updating $f(<newnode/>,"newnode.xml")`,
			`for $e in //employee[skill = "Java"]
return
   copy $je := $e
   modify delete node $je/salary
return $je`,
			`let $oldx := /a/b/x
return
   copy $newx := $oldx
   modify (rename node $newx as "newx",
           replace value of node $newx with $newx * 2)
return ($oldx, $newx)`,
			//			`N transform with { U }
			//`,
			`copy $v := N
modify $v!(U)
return $v`,
			`for $p in /inventory/part
let $deltap := $changes/part[partno eq $p/partno]
return
    replace value of node $p/quantity
with $p/quantity + $deltap/quantity`,
			`if ($e/@last-updated)
then replace value of node
        $e/last-updated with fn:currentDate()
else insert node
attribute last-updated {fn:currentDate()} into $e`,
			`let $q := /inventory/item[serialno = "123456"]/quantity
return
   ( replace value of node $q with ( ),
insert node attribute xsi:nil {"true"} into $q )`,
		];
		for (const parserName of ['XQuery31Full']) {
			describe(`Using the parser ${parserName}`, () => {
				const parser = parsers[parserName];
				for (let i = 0; i < examplesFromDocs.length; ++i) {
					const example =
						typeof examplesFromDocs[i] === 'string' ? examplesFromDocs[i] : examplesFromDocs[i][parserName];
					it(`works with the example ${i}: ${examplesFromDocs[i]}`, () => {
						const result = parser(example);

						assert.ok(result, 'There should be some result');
					});
				}

				it('works with simple queries', (t) => {
					const result = parser('update insert $a into $b');

					assert.ok(result, 'There should be some result');
				});
			});
		}
	});

	describe('XQUF keywords as function names', () => {
		function findNode(node: any, type: string): boolean {
			if (!node || typeof node !== 'object') return false;
			if (node.type === type) return true;
			return (node.children ?? []).some((c: any) => findNode(c, type));
		}

		const functionCallCases: [string, string][] = [
			['replace(1, "a", "b")', 'replace'],
			['insert(1, 2)', 'insert'],
			['delete(1)', 'delete'],
			['rename(1)', 'rename'],
			['copy($x)', 'copy'],
			['invoke($f)', 'invoke'],
		];

		for (const parserName of ['XQuery31Full', 'XQuery4Full'] as const) {
			describe(`Using the parser ${parserName}`, () => {
				const parser = parsers[parserName];

				for (const [input, name] of functionCallCases) {
					it(`parses ${name}(...) as a function call`, () => {
						const result = parser(input);
						assert.ok(result, 'There should be some result');
						assert.ok(findNode(result.ast, 'FunctionCall'), `${input} should parse as FunctionCall`);
					});
				}

				it('still parses replace node ... with ... as XQUF_ReplaceExpr', () => {
					const result = parser('replace node $x with $y');
					assert.ok(result, 'There should be some result');
					assert.ok(findNode(result.ast, 'XQUF_ReplaceExpr'), 'Should parse as XQUF_ReplaceExpr');
				});

				it('still parses insert node ... into ... as XQUF_InsertExpr', () => {
					const result = parser('insert node $a into $b');
					assert.ok(result, 'There should be some result');
					assert.ok(findNode(result.ast, 'XQUF_InsertExpr'), 'Should parse as XQUF_InsertExpr');
				});
			});
		}
	});
});
