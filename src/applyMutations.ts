import {ParseException, Parser} from './ebnfparser.ts';
import type { Mutation } from './mutations.ts';
import { Handler, Node, NonTerminal, Terminal } from './parseEbnf.ts';

export default function applyMutations(inputEbnf: string, mutations: Mutation[]): string {
	const handler = new Handler();
	const parser = new Parser(inputEbnf, handler);

	try {
		parser.parse_Grammar();
	} catch (err) {
		if (err instanceof ParseException) {
			throw new Error(`Parser error: ${parser.getErrorMessage(err)}`)
		}
	}

	const result = handler.getResult();

	const followPath = (root: NonTerminal, parts: string[]): NonTerminal[] => {
		const nodes = [root];
		const [part, ...rest] = parts;
		if (!part) {
			return nodes;
		}
		return root.getChildren(part).flatMap((child: Node) => {
			if (child instanceof Terminal) {
				return [];
			}
			return followPath(child as NonTerminal, rest);
		});
	};

	const syntaxDefinition = followPath(result, ['Grammar', 'SyntaxDefinition'])[0];
	const syntaxProductions = followPath(syntaxDefinition, ['SyntaxProduction']);
	for (const mutation of mutations) {
		for (const additionalRule of mutation.additionalRules) {
			parser.initialize(additionalRule, handler);

			parser.parse_Grammar();

			const newParseResult = handler.getResult();
			const additionalRules = followPath(newParseResult, ['Grammar', 'SyntaxDefinition', 'SyntaxProduction']);

			syntaxDefinition.children.push(...additionalRules);
		}

		const ruleToAmend = syntaxProductions.find((syntaxProduction) => {
			const name = syntaxProduction.getChildren('Terminal')[0] as Terminal;

			return name.value === mutation.where;
		})!;

		const choice = ruleToAmend.getChildren('SyntaxChoice')[0] as NonTerminal;
		choice.children.unshift(new Terminal(mutation.name, -1, -1), new Terminal('|', -1, -1));
	}

	return `<?pi?>
${result.toString()}
<?ENCORE?>
<?pi?>`;
}
