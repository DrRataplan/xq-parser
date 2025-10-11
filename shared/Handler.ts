import { NonTerminal, Terminal } from './Node.ts';
export default class Handler {
	public root: NonTerminal | null = null;
	public stack: NonTerminal[] = [];
	public code: string = '';

	scratchPad: (Terminal | NonTerminal)[] = [];
	constructor() {
		this.reset('');
	}

	reset(code: string) {
		this.root = new NonTerminal('ROOT', 0, code.length);
		this.stack = [this.root];
		this.code = code;
		this.scratchPad = [];
	}
	terminal(_type: string, start: number, end: number) {
		const value = this.code.substring(start, end);
		const terminalNode = new Terminal(value, start, end);
		this.scratchPad.push(terminalNode);
	}
	nonterminal(type: string, start: number, end: number) {
		const terminalNode = new NonTerminal(type, start, end);
		this.scratchPad.push(terminalNode);
	}

	getResult(): NonTerminal {
		for (const node of this.scratchPad.reverse()) {
			let parent = this.peek();
			while (parent.start > node.start) {
				// We moved past the end of this node already
				this.stack.pop();
				parent = this.peek();
			}
			parent.children.unshift(node);
			if (node instanceof NonTerminal) {
				this.stack.push(node);
			}
		}
		return this.root!;
	}

	peek(): NonTerminal {
		return this.stack[this.stack.length - 1];
	}
}
