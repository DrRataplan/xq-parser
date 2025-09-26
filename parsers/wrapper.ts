import { Handler, Node } from '../src/parseEbnf.ts';

// Locally declare the needed types so we can just ducktype them in when using them
//const TParseMeth
type Parser<TParseMethod extends string> = {
	/**
	 * This is in practice either parse_Module or parse_Query
	 */
	[P in TParseMethod]: ()=> void;
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

export type WrappedParser = (input: string) => Node

export default function makeWrapper<TParseMethod extends string>(
	ParserImpl: new (source: string, parsingEventHandler: BottomUpEventHandler) => Parser<TParseMethod>,
	parseMethod: TParseMethod,
	ParseExceptionImpl: new (b: number, e: number, s: number, o: number, x: number) => ParseException
): WrappedParser {
	const runParser = (input: string): Node => {
		const handler = new Handler();
		const parser = new ParserImpl(input, handler);
		try {
			parser[parseMethod]();
		} catch (err) {
			if (err instanceof ParseExceptionImpl) {
				throw new Error(`Parser error: ${parser.getErrorMessage(err)}`);
			}
			throw err;
		}

		return handler.getResult();
	};
	return runParser;
}
