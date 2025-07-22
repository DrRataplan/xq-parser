#!/usr/bin/env node

import applyMutations from './applyMutations.ts';
import mutations from './mutations.ts';

import { readFile } from 'fs/promises';

async function main(mainEbnfPath: string) {
	let xquery4Ebnf: string;
	try {
		xquery4Ebnf = await readFile(mainEbnfPath, 'utf-8');
	} catch(err) {
		console.log(`Error opening file ${mainEbnfPath}`, err)
		process.exit(-1)
	}

	try {
		const result = applyMutations(xquery4Ebnf, mutations);

		console.log(result);
	} catch (err) {
		console.error(`Error parsing ebnf`, err);
	}
}

const mainEbnfPath = process.argv[2];

if (!mainEbnfPath || mainEbnfPath === '--help') {
	console.log('Usage: ebnf-combinator <path-to-ebnf>');
	process.exit(-1);
}

void main(mainEbnfPath);
