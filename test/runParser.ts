import { ParseException as ParseException4, Parser as Parser4 } from '../parsers/XQuery-40-full.ts';
import { ParseException as ParseException3, Parser as Parser3 } from '../parsers/XQuery-31-full.ts';
import { Handler, Node } from '../src/parseEbnf.ts';

export default function runParser(input: string, version: 3|4): Node {
	const Parser = version === 4 ? Parser4 : Parser3
	const ParseException = version === 4 ? ParseException4 : ParseException3;
	const handler = new Handler();
	const parser = new Parser(input, handler);
	try {
		if (version === 4) {
			parser.parse_Module();
		} else {
			parser.parse_XQuery()
		}
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
