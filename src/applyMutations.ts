import { ParseException, Parser } from './ebnfparser.ts';
import type { Mutation } from './mutations.ts';
import { Handler, Node, NonTerminal, Terminal } from '../shared/parseEbnf.ts';

function nodeToString(node: Terminal | NonTerminal): string {
	if (node instanceof Terminal) {
		if (node.value === '<?TOKENS?>') {
			return node.value + '\n';
		}

		if (node.value === '<?ENCORE?>') {
			return node.value + '\n';
		}

		return node.value;
	}

	const children = node.children.map((child) => child.toString());
	if (node.type === 'Option' || node.type === 'CharClass' || node.type === 'EquivalenceCharRange') {
		return node.children.map((child) => nodeToString(child)).join('');
	}
	if (node.type === 'SyntaxDefinition') {
		return node.children.map((child) => nodeToString(child)).join('\n');
	}
	if (node.type === 'LexicalDefinition') {
		return `\n${node.children.map((child) => nodeToString(child)).join('\n')}`;
	}
	return children.join(' ');
}

export default function applyMutations(inputEbnf: string, mutations: Mutation[]): string {
	const handler = new Handler();
	const parser = new Parser(inputEbnf, handler);

	try {
		parser.parse_Grammar();
	} catch (err) {
		if (err instanceof ParseException) {
			console.error(parser.getErrorMessage(err));
			throw new Error(`Parser error: ${parser.getErrorMessage(err)}`);
		}
		console.error(err);
		throw err;
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

	const lexicalDefinition = followPath(result, ['Grammar', 'LexicalDefinition'])[0];
	const lexicalProductions = followPath(lexicalDefinition, ['LexicalProduction']);
	for (const mutation of mutations) {
		const isProduction = (production: NonTerminal) => {
			const name = production.getChildren('Terminal')[0] as Terminal;

			if (!Array.isArray(mutation.where)) {
				return name.value === mutation.where;
			}
			return mutation.where.includes(name.value);
		};

		let isLexical = false;
		let ruleToAmend = syntaxProductions.find(isProduction);
		let choice = ruleToAmend?.getChildren('SyntaxChoice')[0] as NonTerminal;
		if (!ruleToAmend) {
			ruleToAmend = lexicalProductions.find(isProduction);
			isLexical = true;
			choice = ruleToAmend?.getChildren('ContextChoice')[0] as NonTerminal;
		}
		if (!ruleToAmend) {
			console.error(
				'No rule found to amend',
				mutation.where,
				lexicalProductions
					.concat(syntaxProductions)
					.map((x) => (x.getChildren('Terminal')[0] as Terminal).value)
			);
			continue;
		}

		choice.children.unshift(
			new Terminal(mutation.name, -1, -1),
			new Terminal('|', -1, -1),
			new Terminal('(', -1, -1)
		);
		choice.children.push(new Terminal(')', -1, -1));

		for (const additionalRule of mutation.additionalRules) {
			parser.initialize(additionalRule, handler);

			try {
				parser.parse_Grammar();
			} catch (err) {
				if (err instanceof ParseException) {
					console.error('Changing the AST failed', parser.getErrorMessage(err));
					throw err;
				}
				console.error('Something failed', err);
				throw err;
			}

			const newParseResult = handler.getResult();
			const additionalRules = followPath(newParseResult, ['Grammar', 'SyntaxDefinition', 'SyntaxProduction']);

			if (isLexical) {
				lexicalDefinition.children.push(...additionalRules);
			} else {
				syntaxDefinition.children.push(...additionalRules);
			}
		}
	}

	return `<?pi?>
${nodeToString(result)}
<?ENCORE?>
<?pi?>`;
}
