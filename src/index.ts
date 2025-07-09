#!/usr/bin/env node

import applyMutations from './applyMutations.ts';
import mutations from './mutations.ts';

import { readFile } from 'fs/promises';

async function main(mainEbnfPath: string) {
	const xquery4Ebnf = await readFile(mainEbnfPath, 'utf-8');

	const result = applyMutations(xquery4Ebnf, mutations);

	console.log(result);
}

const mainEbnfPath = process.argv[2];

if (!mainEbnfPath || mainEbnfPath === '--help') {
	console.log('Usage: ebnf-combinator <path-to-ebnf>');
	process.exit(-1);
}

void main(mainEbnfPath);
