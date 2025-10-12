import { describe, it } from 'node:test';
import runParser from './runParser.ts';
import assert from 'node:assert/strict';

describe('General parser working', () => {
	for (const version of [3, 4]) {
		describe(`Version ${version}`, () => {
			it('can parse a simple script', (t) => {
				const input = '1 + 1';

				const result = runParser(input, version as 3 | 4);
				assert.ok(result, 'There should be some result');
			});

			it('can detect comments', (t) => {
				const input = '(: A :)a';
				const result = runParser(input, version as 3 | 4);
				assert.ok(result.ast, 'There should be some result');
				assert.ok(result.comments, 'There should be some comments detected');
				assert.deepEqual(
					result.comments.map((c) => c.value),
					['(: A :)']
				);
			});

			it('can detect multiple comments', (t) => {
				const input = '(: A :)(: B :)(: C :)a';
				const result = runParser(input, version as 3 | 4);
				assert.ok(result.ast, 'There should be some result');
				assert.ok(result.comments, 'There should be some comments detected');
				assert.deepEqual(
					result.comments.map((c) => c.value),
					['(: A :)', '(: B :)', '(: C :)']
				);
			});
		});
	}
});
