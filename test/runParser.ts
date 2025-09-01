import { ParseException, Parser } from '../XQuery-40-full.ts';
import { Handler, Node } from '../src/parseEbnf.ts';

export default function runParser(input: string): Node {
	const handler = new Handler();
	const parser = new Parser(input, handler);
	try {
		parser.parse_Module();
	} catch (err) {
		if (err instanceof ParseException) {
			const begin = err.getBegin();
			const offset = 0;
			const lines = input.split(/\n/);
			console.log(`Error at ${begin} - ${err.getEnd()}`);
			for (const line of lines) {
				if (offset + line.length > begin) {
					console.error(line);
					const filler = Array(begin - offset)
						.fill(' ')
						.join('');
					const markers = Array(err.getEnd() - begin)
						.fill('^')
						.join('');
					console.error(filler + markers);
					break;
				}
			}

			console.error(input);
			throw new Error(`Parser error: ${parser.getErrorMessage(err)}`);
		}
		throw err;
	}

	return handler.getResult();
}
