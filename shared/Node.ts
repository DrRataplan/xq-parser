abstract class BaseNode {
	public abstract readonly isTerminal: boolean;
	public readonly type: string;
	public readonly start: number;
	public readonly end: number;
	constructor(type: string, start: number, end: number) {
		this.type = type;

		this.start = start;
		this.end = end;
	}
}

export class Terminal extends BaseNode {
	/**
	 * The value of the node
	 */
	public readonly value: string;
	/**
	 * Whether this node is terminal. Always returns true
	 */
	public readonly isTerminal = true;
	constructor(type: string, value: string, start: number, end: number) {
		super(type, start, end);
		this.value = value;
	}
}

export class NonTerminal extends BaseNode {
	/**
	 * Whether this node is terminal. Always returns false
	 */
	public readonly isTerminal = false;
	/**
	 * The children of this nonTerminal node
	 */
	public readonly children: (Terminal | NonTerminal)[] = [];
	constructor(type: string, start: number, end: number) {
		super(type, start, end);
	}
	getChildren(type: string): Node[] {
		return this.children.filter((child) => child.type === type);
	}
}

export type Node = Terminal | NonTerminal;
