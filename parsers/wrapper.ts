import { NonTerminal, Terminal, type Node } from '../shared/Node.ts';
import Handler from '../shared/Handler.ts';
import { ParseTreeBuilder } from './XQuery-31-full.ts';

// Locally declare the needed types so we can just ducktype them in when using them
//const TParseMeth
type Parser<TParseMethod extends string> = {
	/**
	 * This is in practice either parse_Module or parse_Query
	 */
	[P in TParseMethod]: () => void;
} & {
	initialize(source: string, parsingEventHandler: BottomUpEventHandler): void;
	getErrorMessage(e: ParseException): string;
};

type BottomUpEventHandler = {
	reset(input: string): void;
	nonterminal(name: string, begin: number, end: number, count: number): void;
	terminal(name: string, begin: number, end: number): void;
};

type ParseException = any;

export type WrappedParser = (input: string) => { comments: Terminal[]; ast: NonTerminal };

function offsetToCoords(text: string, offset: number) {
	const before = text.substring(0, offset);
	const lines = before.split('\n');
	const line = lines.length;
	const column = lines[lines.length - 1].length;
	return { line, column };
}

export default function makeWrapper<TParseMethod extends string>(
	ParserImpl: new (source: string, parsingEventHandler: BottomUpEventHandler) => Parser<TParseMethod>,
	parseMethod: TParseMethod,
	ParseExceptionImpl: new (b: number, e: number, s: number, o: number, x: number) => ParseException
): WrappedParser {
	const runParser = (input: string) => {
		const ptb = new ParseTreeBuilder();
		const parser = new ParserImpl(input, ptb);
		try {
			parser[parseMethod]();
		} catch (err) {
			if (!(err instanceof ParseExceptionImpl)) {
				throw err;
			}

			// Generate a nice syntax error
			const start = offsetToCoords(input, err.getBegin());
			const end = offsetToCoords(input, err.getBegin());

			const prettierError = new SyntaxError(`${parser.getErrorMessage(err)} (${start.line}:${start.column})`);
			throw Object.assign(prettierError, {
				loc: {
					start,
					end,
				},
			});
		}

		const handler = new Handler();

		ptb.serialize(handler);
		return {
			comments: handler.comments,
			ast: handler.root!,
		};
	};
	return runParser;
}
