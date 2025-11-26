import { Terminal } from './Node.ts';

export default function findCommentsInWhitespace(input: string, startOffsetInScript: number): Terminal[] {
	// XQuery comments can be nested.
	let nestedLevel = 0;
	let offset = 0;
	let currentComment = '';
	const foundComments: Terminal[] = [];
	let commentStartOffset = 0;
	while (offset < input.length) {
		if (input[offset] === '(' && input[offset + 1] === ':') {
			// Comment start!
			nestedLevel++;
			if (nestedLevel === 1) {
				// Just started a comment
				commentStartOffset = offset;
			}
			offset += 2;
			continue;
		}
		if (input[offset] === ':' && input[offset + 1] === ')') {
			// Comment end!
			offset += 2;
			nestedLevel--;
			if (nestedLevel === 0) {
				foundComments.push(
					new Terminal(
						'Comment',
						input.substring(commentStartOffset, offset),
						startOffsetInScript + commentStartOffset,
						startOffsetInScript + offset
					)
				);
				continue;
			}
		}
		if (nestedLevel > 0) {
			// We are in a comment: add this to the current comment
			currentComment += input[offset];
		}
		offset++;
	}
	return foundComments;
}
