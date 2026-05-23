#!/usr/bin/env node

import applyMutations from './applyMutations.ts';

import { existDBMutations, existDBTokenMutations, existDBFunctionNameKeywords } from './exist-mutations.ts';
import { xqufMutations, xqufTokenMutations, xqufFunctionNameKeywords } from './xquf-mutations.ts';

import {
	existDBTokenMutationsXQ4,
	existDBMutationsXQ4,
	xqufMutationsXQ4,
	xqufTokenMutationsXQ4,
	xqufFunctionNameKeywordsXQ4,
	existDBFunctionNameKeywordsXQ4,
} from './xq4/xquery4-transformations.ts';

const xq31Mutations = [...existDBMutations, ...xqufMutations];
const xq31TokenMutations = [...existDBTokenMutations, ...xqufTokenMutations];

const xq4Mutations = [...existDBMutationsXQ4, ...xqufMutationsXQ4];
const xq4TokenMutations = [...existDBTokenMutationsXQ4, ...xqufTokenMutationsXQ4];

import { readFile } from 'fs/promises';
import type { Mutation, TokenMutation } from './mutations.ts';

async function main(mainEbnfPath: string) {
	let xqueryEbnf: string;
	try {
		xqueryEbnf = await readFile(mainEbnfPath, 'utf-8');
	} catch (err) {
		console.log(`Error opening file ${mainEbnfPath}`, err);
		process.exit(-1);
	}

	let mutations: Mutation[];
	let tokenMutations: TokenMutation[];
	let functionNameKeywords: string[];
	if (mainEbnfPath.endsWith('40.ebnf')) {
		mutations = xq4Mutations;
		tokenMutations = xq4TokenMutations;
		functionNameKeywords = [...xqufFunctionNameKeywordsXQ4, ...existDBFunctionNameKeywordsXQ4];
	} else {
		mutations = xq31Mutations;
		tokenMutations = xq31TokenMutations;
		functionNameKeywords = [...xqufFunctionNameKeywords, ...existDBFunctionNameKeywords];
	}

	try {
		const result = applyMutations(xqueryEbnf, mutations, tokenMutations, functionNameKeywords);

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
