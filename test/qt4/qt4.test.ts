/**
 * QT4 parser conformance test.
 *
 * Runs against the W3C QT4 test suite (qt4cg/qt4tests git submodule) to detect:
 * - false positives: we fail to parse a query the spec considers valid
 * - false negatives: we parse a query the spec says has a syntax error (XPST0003)
 *
 * Tests are run under both parsers unless the spec dependency is XQ40-only,
 * in which case only the XQuery 4 parser is tested.
 *
 * Requires QT4_TESTS_DIR env var pointing at the qt4tests checkout.
 * In CI this is set to the workspace's qt4tests submodule directory.
 *
 * To generate/refresh snapshots:
 *   QT4_TESTS_DIR=qt4tests node --experimental-strip-types --test --test-update-snapshots test/qt4/qt4.test.ts
 */

import { test } from 'node:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { Worker } from 'node:worker_threads';
import * as slimdom from 'slimdom';
import type { TestInput, TestOutput, Grammar } from './qt4-worker.ts';

const NS = 'http://www.w3.org/2010/09/qt-fots-catalog';

const XQ31_COMPAT = new Set([
	'XP20', 'XP20+', 'XP30', 'XP30+', 'XP31', 'XP31+',
	'XQ10', 'XQ10+', 'XQ30', 'XQ30+', 'XQ31', 'XQ31+',
]);

const SKIP_FEATURES = new Set([
	'staticTyping', 'schemaImport', 'schemaValidation',
	'schemaAware', 'externalFunctions', 'serialization',
]);

function childEls(parent: slimdom.Element, localName?: string): slimdom.Element[] {
	const out: slimdom.Element[] = [];
	for (const child of parent.children) {
		if (!localName || child.localName === localName) out.push(child as slimdom.Element);
	}
	return out;
}

interface Dep {
	type: string;
	value: string;
	satisfied: boolean;
}

function getDeps(el: slimdom.Element): Dep[] {
	return childEls(el, 'dependency').map((d) => ({
		type: d.getAttribute('type') ?? '',
		value: d.getAttribute('value') ?? '',
		satisfied: (d.getAttribute('satisfied') ?? 'true') !== 'false',
	}));
}

/** Returns which grammars to run a test under based on its spec dependencies. */
function getGrammars(deps: Dep[]): Grammar[] {
	const specDeps = deps.filter((d) => d.type === 'spec' && d.satisfied);
	if (specDeps.length === 0) return ['xq31', 'xq40'];
	for (const dep of specDeps) {
		const alts = dep.value.trim().split(/\s+/);
		// If any alternative is XQ31-compatible, run on both parsers
		if (alts.some((s) => XQ31_COMPAT.has(s))) return ['xq31', 'xq40'];
	}
	// No XQ31-compatible alternative found: XQ40-only test
	return ['xq40'];
}

function shouldInclude(deps: Dep[]): boolean {
	for (const dep of deps) {
		if (!dep.satisfied) continue;
		if (dep.type === 'feature' && SKIP_FEATURES.has(dep.value)) return false;
	}
	return true;
}

type Expected = 'parse-error' | 'parse-success' | 'ambiguous';

function getExpected(resultEl: slimdom.Element): { expected: Expected; code: string | null } {
	const errs = childEls(resultEl, 'error');
	if (errs.length === 1) {
		const code = errs[0].getAttribute('code') ?? '';
		if (code === '*') return { expected: 'ambiguous', code: null };
		return { expected: code === 'XPST0003' ? 'parse-error' : 'parse-success', code: code === 'XPST0003' ? code : null };
	}

	const anyOf = childEls(resultEl, 'any-of')[0];
	if (anyOf) {
		const kids = childEls(anyOf);
		if (kids.every((k) => k.localName === 'error')) {
			const codes = kids.map((k) => k.getAttribute('code') ?? '');
			if (codes.some((c) => c === '*')) return { expected: 'ambiguous', code: null };
			if (codes.every((c) => c === 'XPST0003')) return { expected: 'parse-error', code: 'XPST0003' };
		}
		return { expected: 'ambiguous', code: null };
	}

	return { expected: 'parse-success', code: null };
}

function runInWorker(batch: TestInput[]): Promise<TestOutput[]> {
	return new Promise((resolve, reject) => {
		const w = new Worker(new URL('./qt4-worker.ts', import.meta.url), { workerData: batch });
		w.on('message', resolve);
		w.on('error', reject);
		w.on('exit', (code) => {
			if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
		});
	});
}


const QT4_DIR = process.env.QT4_TESTS_DIR;
const SNAP_DIR = path.join(import.meta.dirname, 'qt4-snaps');

const catalogPath = QT4_DIR ? path.join(QT4_DIR, 'catalog.xml') : null;
if (catalogPath && fs.existsSync(catalogPath)) {
	const catalogXml = fs.readFileSync(catalogPath, 'utf8');
	const catalogDoc = slimdom.parseXmlDocument(catalogXml);
	const testSetFiles = Array.from(catalogDoc.getElementsByTagNameNS(NS, 'test-set'))
		.map((el) => (el as slimdom.Element).getAttribute('file'))
		.filter((f): f is string => f !== null);

	const allInputs: TestInput[] = [];
	// ordered unique keys of slug--grammar, preserving first-seen order
	const orderedKeys: string[] = [];
	const seenKeys = new Set<string>();

	for (const tsFile of testSetFiles) {
		const xmlPath = path.join(QT4_DIR, tsFile);
		let xml: string;
		try {
			xml = fs.readFileSync(xmlPath, 'utf8');
		} catch {
			continue;
		}
		let doc: slimdom.Document;
		try {
			doc = slimdom.parseXmlDocument(xml);
		} catch {
			continue;
		}

		const root = doc.documentElement!;
		const tsDepsList = getDeps(root);
		const slug = tsFile.replace(/[/\\]/g, '-').replace(/\.xml$/, '');

		for (const tc of childEls(root, 'test-case')) {
			const name = tc.getAttribute('name') ?? '';
			const tcDeps = getDeps(tc);
			const allDeps = [...tsDepsList, ...tcDeps];
			if (!shouldInclude(allDeps)) continue;

			const testEl = childEls(tc, 'test')[0];
			const resultEl = childEls(tc, 'result')[0];
			if (!testEl || !resultEl) continue;

			const { expected, code: expectedCode } = getExpected(resultEl);
			if (expected === 'ambiguous') continue;

			const fileRef = testEl.getAttribute('file');
			let query: string;
			if (fileRef) {
				const filePath = path.join(QT4_DIR, fileRef);
				if (!fs.existsSync(filePath)) continue;
				query = fs.readFileSync(filePath, 'utf8');
			} else {
				query = testEl.textContent ?? '';
			}

			for (const grammar of getGrammars(allDeps)) {
				const key = `${slug}--${grammar}`;
				allInputs.push({
					testSetSlug: slug,
					testCase: name,
					query,
					grammar,
					expected,
					expectedCode,
				});
				if (!seenKeys.has(key)) {
					seenKeys.add(key);
					orderedKeys.push(key);
				}
			}
		}
	}

	const N = Math.max(1, os.availableParallelism());
	const chunkSize = Math.ceil(allInputs.length / N);
	const batches: TestInput[][] = [];
	for (let i = 0; i < N; i++) {
		const batch = allInputs.slice(i * chunkSize, (i + 1) * chunkSize);
		if (batch.length > 0) batches.push(batch);
	}

	const allResults: TestOutput[] = (await Promise.all(batches.map(runInWorker))).flat();

	const byKey = new Map<string, TestOutput[]>();
	for (const r of allResults) {
		const key = `${r.testSetSlug}--${r.grammar}`;
		const arr = byKey.get(key);
		if (arr) arr.push(r);
		else byKey.set(key, [r]);
	}

	for (const key of orderedKeys) {
		const results = byKey.get(key) ?? [];
		const failures = results
			.filter((r) => r.outcome !== 'pass')
			.map((r) => ({ testCase: r.testCase, outcome: r.outcome, expectedCode: r.expectedCode ?? undefined }));
		const snapPath = path.join(SNAP_DIR, `${key}.snap`);

		test(`qt4/${key}`, async (t) => {
			await t.assert.fileSnapshot(failures, snapPath);
		});
	}
}
