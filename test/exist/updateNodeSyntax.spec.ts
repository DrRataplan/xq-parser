import { describe, it } from 'node:test';
import runParser from '../runParser.ts';

describe('eXist-db update node syntax', () => {
	describe('Examples from the docs', () => {
		const examplesFromDocs = [
			`let $node := <root><a/></root>
return
update insert <b/> into $node/a`,
			`for $address in //address
return
update delete //address`,
			`for $address in //address
return
update delete $address`,
			`update insert <email type="office">andrew@gmail.com</email> into //address[fname="Andrew"]
`,
			// Note, the next one does not parse in XQuery 4 anymore

			//			`update insert attribute type {'permanent'} into //address[fname="Andrew"]`,
			`update insert attribute {'type'} {'permanent'} into //address[fname="Andrew"]`,

			`update replace //fname[. = "Andrew"] with <fname>Andy</fname>`,
			`update value //fname[. = "Andrew"] with 'Andy'`,
			`for $city in //address/city
return
update delete $city`,
			`for $city in //address/city
return
    update rename $city as 'locale'`,
		];
		for (let i = 0; i < examplesFromDocs.length; ++i) {
			it(`works with the example ${i}: ${examplesFromDocs[i]}`, (t) => {
				const result = runParser(examplesFromDocs[i]);

				t.assert.ok(result, 'There should be some result');
			});
		}

		it('works with simple queries', (t) => {
			const result = runParser('update insert $a into $b');

			t.assert.ok(result, 'There should be some result');
		});
	});
});
