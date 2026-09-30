// Compares the QT4 snapshots in the working tree against those at git HEAD.
// Snapshots only list failing test cases, so any (file, testCase, grammar) entry
// that is present now but was not at HEAD is a new failure.
// Prints the new failures and exits 1 if there are any.
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const dir = 'test/qt4/qt4-snaps';

const keys = (json) =>
	new Set(JSON.parse(json).map((e) => `${e.testSetSlug ?? ''}/${e.grammar ?? ''}/${e.testCase}/${e.outcome}`));

const newFailures = [];
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.snap'))) {
	const now = keys(fs.readFileSync(path.join(dir, file), 'utf8'));
	let before = new Set();
	try {
		before = keys(execFileSync('git', ['show', `HEAD:${dir}/${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
	} catch {
		// snapshot file is new: everything in it counts as new
	}
	for (const k of now) if (!before.has(k)) newFailures.push(`${file}: ${k}`);
}

if (newFailures.length > 0) {
	console.log(newFailures.join('\n'));
	console.error(`${newFailures.length} new failure(s)`);
	process.exit(1);
}
console.log('No new failures');
