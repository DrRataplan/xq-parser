import { XQuery4Full, XQuery31Full } from '../parsers/index.ts';
import { Node } from '../shared/Node.ts';

export default function runParser(input: string, version: 3 | 4): Node {
	const parser = version === 4 ? XQuery4Full : XQuery31Full;

	return parser(input);
}
