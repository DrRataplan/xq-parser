export abstract class Node {
	public readonly type: string;
	public readonly start: number;
	public readonly end: number;
	constructor(type: string, start: number, end: number) {
		this.type = type;

		this.start = start;
		this.end = end;
	}
}

export class Terminal extends Node {
	public readonly value: string;
	constructor(value: string, start: number, end: number) {
		super('Terminal', start, end);
		this.value = value;
	}
}

export class NonTerminal extends Node {
	public readonly children: (Terminal | NonTerminal)[] = [];
	constructor(type: string, start: number, end: number) {
		super(type, start, end);
	}
	getChildren(type: string): Node[] {
		return this.children.filter((child) => child.type === type);
	}
}
