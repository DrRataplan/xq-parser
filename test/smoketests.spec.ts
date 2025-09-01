import { describe, it } from "node:test";
import runParser from "./runParser.ts";

describe.only('General parser working', () => {
	it('can parse a simple script', (t) => {
		const input = '1 + 1';


		const result = runParser(input);
		t.assert.ok(result, 'There should be some result')
	});
});
