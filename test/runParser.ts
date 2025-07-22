import { ParseException, Parser } from '../XQuery-40-full.ts';
import { Handler, Node } from '../src/parseEbnf.ts';


export default function runParser(input: string): Node {
	const handler = new Handler()
	const parser = new Parser(input, handler);
	try {
		parser.parse_XPath()
	} catch(err) {
		if (err instanceof ParseException) {
			throw new Error(`Parser error: ${parser.getErrorMessage(err)}`)
		}
		throw err;
	}

	return handler.getResult();
};
