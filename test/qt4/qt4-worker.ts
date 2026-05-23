import { workerData, parentPort, isMainThread } from 'node:worker_threads';
import { XQuery4Full, XQuery31Full } from '../../parsers/index.ts';

export type Grammar = 'xq31' | 'xq40';

export interface TestInput {
	testSetSlug: string;
	testCase: string;
	query: string;
	grammar: Grammar;
	expected: 'parse-error' | 'parse-success';
	expectedCode: string | null;
}

export interface TestOutput {
	testSetSlug: string;
	testCase: string;
	grammar: Grammar;
	outcome: 'pass' | 'parse-failed' | 'parse-succeeded';
	expectedCode: string | null;
}

function tryParse(query: string, grammar: Grammar): boolean {
	try {
		const parser = grammar === 'xq40' ? XQuery4Full : XQuery31Full;
		parser(query);
		return true;
	} catch {
		return false;
	}
}

if (!isMainThread) {
	const batch = workerData as TestInput[];
	const results: TestOutput[] = batch.map((tc) => {
		const parsed = tryParse(tc.query, tc.grammar);
		const outcome =
			tc.expected === 'parse-error'
				? parsed
					? 'parse-succeeded'
					: 'pass'
				: parsed
					? 'pass'
					: 'parse-failed';
		return {
			testSetSlug: tc.testSetSlug,
			testCase: tc.testCase,
			grammar: tc.grammar,
			outcome,
			expectedCode: tc.expectedCode,
		};
	});
	parentPort!.postMessage(results);
}
