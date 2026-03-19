#!/usr/bin/env node

import applyMutations from './applyMutations.ts';

import {existDBMutations, existDBTokenMutations} from './exist-mutations.ts';
import {xqufMutations, xqufTokenMutations} from './xquf-mutations.ts';


export const mutations = [...existDBMutations, ...xqufMutations];
export const tokenMutations = [...existDBTokenMutations, ...xqufTokenMutations];

import { readFile } from 'fs/promises';

async function main(mainEbnfPath: string) {
	let xqueryEbnf: string;
	try {
		xqueryEbnf = await readFile(mainEbnfPath, 'utf-8');
	} catch(err) {
		console.log(`Error opening file ${mainEbnfPath}`, err)
		process.exit(-1)
	}

	try {
		const result = applyMutations(xqueryEbnf, mutations, tokenMutations);

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
