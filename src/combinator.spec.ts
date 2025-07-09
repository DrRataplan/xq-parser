import { readFile } from 'fs/promises';
import { describe, it } from 'node:test';
import applyMutations from './applyMutations.ts';

describe('Combining EBNFs', () => {
	it('works', async (t) => {
		const simpleEbnf = await readFile('src/simple.ebnf', 'utf8');
		const mutations = [
			{
				where: 'B',
				name: 'C',
				additionalRules: [`C ::= 'c' | B`],
			},
		];

		const result = applyMutations(simpleEbnf, mutations);

		t.assert.snapshot(result);
	});
});
