import { ParseException, Parser } from './ebnfparser.ts';
import type { Mutation, TokenMutation } from './mutations.ts';
import { Terminal, NonTerminal, type Node } from '../shared/Node.ts';
import makeWrapper from '../parsers/wrapper.ts';

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

	if (node.type === 'NameOrString') {
		return node.children.map((child) => nodeToString(child)).join('');
	}
	if (node.type === 'CaretName') {
		return node.children.map((child) => nodeToString(child)).join('');
	}
	if (node.type === 'Option' || node.type === 'CharClass' || node.type === 'EquivalenceCharRange') {
		return node.children.map((child) => nodeToString(child)).join('');
	}
	if (node.type === 'SyntaxDefinition') {
		return node.children.map((child) => nodeToString(child)).join('\n');
	}
	if (node.type === 'LexicalDefinition') {
		return `\n${node.children.map((child) => nodeToString(child)).join('\n')}`;
	}
	return node.children.map((child) => nodeToString(child)).join(' ');
}

function getDirectiveName(node: NonTerminal): string {
	const first = node.children[0];
	if (first instanceof Terminal) {
		return first.value;
	}
	return nodeToString(first as NonTerminal);
}

/**
 * NonTerminal constructor is (type, start, end?) with no children param.
 * Children must be pushed onto .children after construction.
 * All helper functions below use this pattern.
 */

/** NameOrString node wrapping a quoted StringLiteral, e.g. 'update' */
function makeStringNameOrString(quotedValue: string): NonTerminal {
	const node = new NonTerminal('NameOrString', -1);
	node.children.push(new Terminal('StringLiteral', quotedValue, -1, -1));
	return node;
}

/**
 * NameOrString node wrapping a plain Name, optionally with a CaretName
 * qualifier. makeNameRef('NCName', 'Token') serialises as 'NCName^Token'.
 */
function makeNameRef(name: string, caretSuffix?: string): NonTerminal {
	const node = new NonTerminal('NameOrString', -1);
	node.children.push(new Terminal('Name', name, -1, -1));
	if (caretSuffix) {
		const caretName = new NonTerminal('CaretName', -1);
		caretName.children.push(new Terminal('Terminal', '^', -1, -1));
		caretName.children.push(new Terminal('Name', caretSuffix, -1, -1));
		node.children.push(caretName);
	}
	return node;
}

/**
 * Preference node: lhs >> rhs1 rhs2 ...
 * Tells REX: when lhs keyword and any rhs token both match, prefer lhs.
 *
 * Preference ::= NameOrString ( '>>' NameOrString+ | '<<' NameOrString+ )
 */
function makePreferenceGT(lhs: NonTerminal, rhs: NonTerminal[]): NonTerminal {
	const node = new NonTerminal('Preference', -1);
	node.children.push(lhs);
	node.children.push(new Terminal('Terminal', '>>', -1, -1));
	for (const r of rhs) {
		node.children.push(r);
	}
	return node;
}

export default function applyMutations(
	inputEbnf: string,
	mutations: Mutation[],
	tokenMutations: TokenMutation[] = []
): string {
	const wrapped = makeWrapper(Parser, 'parse_Grammar', ParseException);
	const result = wrapped(inputEbnf).ast;

	const followPath = (root: NonTerminal, parts: string[]): NonTerminal[] => {
		const [part, ...rest] = parts;
		if (!part) return [root];
		return root.getChildren(part).flatMap((child: Node) => {
			if (child instanceof Terminal) return [];
			return followPath(child as NonTerminal, rest);
		});
	};

	const syntaxDefinition = followPath(result, ['Grammar', 'SyntaxDefinition'])[0];
	const syntaxProductions = followPath(syntaxDefinition, ['SyntaxProduction']);
	const lexicalDefinition = followPath(result, ['Grammar', 'LexicalDefinition'])[0];
	const lexicalProductions = followPath(lexicalDefinition, ['LexicalProduction']);
	const preferences = followPath(lexicalDefinition, ['Preference']);
	const delimiters = followPath(lexicalDefinition, ['Delimiter']);

	// ── Syntax/lexical rule mutations ─────────────────────────────────────────
	for (const mutation of mutations) {
		const isProduction = (production: NonTerminal) => {
			const name = production.getChildren('Name')[0] as Terminal;
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
					.map((x) => (x.getChildren('Terminal')[0] as Terminal)?.value)
			);
			continue;
		}

		choice.children.unshift(
			new Terminal('Terminal', mutation.name, -1, -1),
			new Terminal('Terminal', '|', -1, -1),
			new Terminal('Terminal', '(', -1, -1)
		);
		choice.children.push(new Terminal('Terminal', ')', -1, -1));

		for (const additionalRule of mutation.additionalRules) {
			const newParseResult = wrapped(additionalRule).ast;
			const additionalRules = followPath(newParseResult, ['Grammar', 'SyntaxDefinition', 'SyntaxProduction']);
			if (isLexical) {
				lexicalDefinition.children.push(...additionalRules);
			} else {
				syntaxDefinition.children.push(...additionalRules);
			}
		}
	}

	// ── Token directive mutations ─────────────────────────────────────────────
	for (const tokenMutation of tokenMutations) {
		const targets = Array.isArray(tokenMutation.where) ? tokenMutation.where : [tokenMutation.where];

		for (const target of targets) {
			const directive: NonTerminal | undefined =
				preferences.find((p) => getDirectiveName(p) === target) ??
				delimiters.find((p) => getDirectiveName(p) === target);

			if (!directive) {
				console.error(
					'No token directive found to amend:',
					target,
					'\nPreferences:',
					preferences.map(getDirectiveName),
					'\nDelimiters:',
					delimiters.map(getDirectiveName)
				);
				continue;
			}

			for (const keyword of tokenMutation.tokens) {
				directive.children.push(makeStringNameOrString(`'${keyword}'`));
			}
		}
	}

	// ── Keyword >> preference nodes ───────────────────────────────────────────
	//
	// For each eXist keyword, add a >> Preference so REX prefers the keyword
	// token over NCName^Token / QName^Token when both match in the same state.
	// Without this, GLALR resolves the conflict by picking the name reduction.
	//
	// This generates lines like:
	//   'update' >> NCName^Token QName^Token
	//   'insert' >> NCName^Token QName^Token
	//   ...
	const keywordsNeedingPriority = [
		// eXist-DB keywords that must win over names globally.
		// These immediately follow 'update' so they are never valid names
		// in that parser state — >> is safe.
		'update',
		'insert',
		'delete',
		'replace',
		'rename',
		'value',
		'into',
		// XQUF: 'invoke' is a new keyword not valid as a name in standard XQuery
		'invoke',
		// 'as' is a hard keyword used as a pivot after ExprSingle in both
		// eXist rename and XQUF insert/rename. It is not a valid name start
		// in standard XQuery so >> does not break anything.
		'as',
	];

	// Soft keywords: need to remain valid as names (element names, function
	// names, path steps) in non-update contexts. Adding them to NCName^Token <<
	// and QName^Token << lets REX resolve conflicts via << priority (prefer
	// name when ambiguous) rather than >> (prefer keyword). The grammar rules
	// are structured so these only appear as keywords after other hard keywords
	// that have already committed the parser to an update expression.
	const softKeywordsForNames = [
		'with',
		'copy',
		'modify',
		'after',
		'before',
		'first',
		'last',
		'node',
		'nodes',
		'of',
		'updating',
		'revalidation',
		'skip',
		'invoke',
	];

	const ncNamePref = preferences.find((p) => getDirectiveName(p) === 'NCName^Token');
	const qNamePref = preferences.find((p) => getDirectiveName(p) === 'QName^Token');
	for (const keyword of softKeywordsForNames) {
		if (ncNamePref) ncNamePref.children.push(makeStringNameOrString(`'${keyword}'`));
		if (qNamePref) qNamePref.children.push(makeStringNameOrString(`'${keyword}'`));
	}

	const ncNameToken = makeNameRef('NCName', 'Token');
	const qNameToken = makeNameRef('QName', 'Token');

	for (const keyword of keywordsNeedingPriority) {
		lexicalDefinition.children.push(
			makePreferenceGT(makeStringNameOrString(`'${keyword}'`), [ncNameToken, qNameToken])
		);
	}

	return `<?pi?>
${nodeToString(result)}
<?ENCORE?>
<?pi?>`;
}
