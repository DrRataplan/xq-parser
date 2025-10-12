import type { BottomUpEventHandler } from '../parsers/XQuery-31-full.ts';
import { NonTerminal, Terminal } from './Node.ts';
import findCommentsInWhitespace from './findCommentsInWhitespace.ts';

export default class Handler implements BottomUpEventHandler {
	public root: NonTerminal | null = null;
	public stack: NonTerminal[] = [];
	public code: string = '';
	public comments: Terminal[] = [];

	scratchPad: (Terminal | NonTerminal)[] = [];
	constructor() {
		this.reset('');
	}

	reset(code: string) {
		this.root = new NonTerminal('ROOT', 0, code.length);
		this.stack = [this.root];
		this.code = code;
		this.scratchPad = [];
		this.comments = [];
	}
	terminal(type: string, start: number, end: number) {
		const value = this.code.substring(start, end);
		const terminalNode = new Terminal(type, value, start, end);
		this.scratchPad.push(terminalNode);
	}
	nonterminal(type: string, start: number, end: number) {
		const terminalNode = new NonTerminal(type, start, end);
		this.scratchPad.push(terminalNode);
	}

	whitespace(begin: number, end: number) {
		const contents = this.code.substring(begin, end);
		const comments = findCommentsInWhitespace(contents, begin);
		for (const comment of comments) {
			this.comments.push(comment);
		}
	}

	getResult(): { comments: Terminal[]; ast: NonTerminal } {
		let previousEnd = 0;
		for (const node of this.scratchPad.reverse()) {
			if (node.isTerminal) {
				if (previousEnd < node.start) {
					// We passed whitespace
					this.whitespace(previousEnd, node.start);
					previousEnd = node.end;
				}
			}
			let parent = this.peek();
			while (parent.start > node.start) {
				// We moved past the end of this node already
				this.stack.pop();
				parent = this.peek();
				//				previousEnd = parent.end;
			}
			parent.children.unshift(node);
			if (node instanceof NonTerminal) {
				this.stack.push(node);
			}
		}
		return { comments: this.comments, ast: this.root! };
	}

	peek(): NonTerminal {
		return this.stack[this.stack.length - 1];
	}
}
