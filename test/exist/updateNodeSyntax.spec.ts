import { describe, it } from 'node:test';
import parsers from '../../parsers/index.ts';
import assert from 'node:assert';
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

			{
				XQuery31Full: `update insert attribute type {'permanent'} into //address[fname="Andrew"]`,
				XQuery4Full: `update insert attribute #type {'permanent'} into //address[fname="Andrew"]`,
			},

			`update replace //fname[. = "Andrew"] with <fname>Andy</fname>`,
			`update value //fname[. = "Andrew"] with 'Andy'`,
			`for $city in //address/city
return
update delete $city`,
			`for $city in //address/city
			return
			update rename $city as 'locale'`,
			`update insert element div {} into /`,
		];
		for (const parserName of Object.keys(parsers)) {
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
});
