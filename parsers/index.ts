import makeWrapper, { type WrappedParser } from './wrapper.ts';
import * as XQuery4FullParser from './XQuery-40-full.ts';
import * as XQuery31FullParser from './XQuery-31-full.ts';
export { type Node, type Terminal, type NonTerminal } from '../shared/Node.ts';

export const XQuery4Full = makeWrapper(XQuery4FullParser.Parser, 'parse_Module', XQuery4FullParser.ParseException);
export const XQuery31Full = makeWrapper(XQuery31FullParser.Parser, 'parse_XQuery', XQuery31FullParser.ParseException);

export default {
	XQuery31Full,
	XQuery4Full,
} as Record<string, WrappedParser>;
