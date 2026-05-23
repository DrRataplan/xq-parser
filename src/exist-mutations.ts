export type Mutation = {
	where: string | string[];
	name: string;
	additionalRules: string[];
};

export type TokenMutation = {
	where: string | string[];
	tokens: string[];
};

const existDBKeywords: string[] = ['update', 'insert', 'delete', 'replace', 'rename', 'value', 'into', 'with'];

export const existDBTokenMutations: TokenMutation[] = [{ where: 'NonNCNameChar', tokens: existDBKeywords }];

export const existDBMutations: Mutation[] = [
	{
		where: 'ExprSingle',
		name: 'ExistDB_UpdateExpr',
		additionalRules: [
			`ExistDB_UpdateExpr ::= 'update' ExistDB_UpdateAction`,
			`ExistDB_UpdateAction ::= ExistDB_UpdateInsertExpr | ExistDB_UpdateReplaceExpr | ExistDB_UpdateDeleteExpr | ExistDB_UpdateRenameExpr | ExistDB_UpdateValueExpr`,
			`ExistDB_UpdateInsertExpr  ::= 'insert' ExprSingle 'into' ExprSingle`,
			`ExistDB_UpdateReplaceExpr ::= 'replace' ExprSingle 'with' ExprSingle`,
			`ExistDB_UpdateValueExpr   ::= 'value' ExprSingle 'with' ExprSingle`,
			`ExistDB_UpdateDeleteExpr  ::= 'delete' ExprSingle`,
			// 'as' is already a hard keyword (NonNCNameChar \\ in base grammar,
			// absent from NCName^Token << and QName^Token <<). After 'rename'
			// ExprSingle reduces, 'as' is the only valid lookahead — no conflict.
			`ExistDB_UpdateRenameExpr  ::= 'rename' ExprSingle 'as' ExprSingle`,
		],
	},
];

// 'update' starts ExistDB_UpdateExpr directly in ExprSingle, so the GLALR
// contextual lexer commits to the eXist path without forking into FunctionCall.
// Adding it explicitly to FunctionName lets the parser fork and handle
// update(arg1, arg2) as a user-defined function call.
export const existDBFunctionNameKeywords: string[] = ['update'];

export default existDBMutations;
