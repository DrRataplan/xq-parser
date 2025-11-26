import type { ParsingEventHandler } from '../parsers/XQuery-31-full.ts';
import { NonTerminal, Terminal } from './Node.ts';
import findCommentsInWhitespace from './findCommentsInWhitespace.ts';

export default class Handler implements ParsingEventHandler {
	public root: NonTerminal | null = null;
	public code: string = '';
	public comments: Terminal[] = [];

	private stack: (Terminal | NonTerminal)[] = [];

	constructor() {
		this.reset('');
	}

	reset(code: string) {
		this.root = new NonTerminal('ROOT', 0, code.length);
		this.stack = [this.root];
		this.code = code;
		this.comments = [];
	}
	startNonterminal(type: string, start: number) {
		const node = new NonTerminal(type, start);
		const parent = this.peek();
		parent.children.push(node);
		this.stack.push(node);
	}
	endNonterminal(_type: string, end: number) {
		const nonTerminal = this.stack.pop()!;
		nonTerminal.end = end;
	}
	terminal(type: string, start: number, end: number) {
		const node = new Terminal(type, this.code.substring(start, end), start, end);
		const parent = this.peek();
		parent.children.push(node);
	}

	whitespace(begin: number, end: number) {
		const contents = this.code.substring(begin, end);
		const comments = findCommentsInWhitespace(contents, begin);
		for (const comment of comments) {
			this.comments.push(comment);
		}
	}

	peek(): NonTerminal {
		return this.stack[this.stack.length - 1] as NonTerminal;
	}
}
