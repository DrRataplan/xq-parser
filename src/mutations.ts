export type Mutation = {
	where: string | string[];
	name: string;
	additionalRules: string[];
};

const existDBMutations: Mutation[] = [
	{
		where: 'ExprSingle',
		name: 'ExistDB_UpdateExpr',
		additionalRules: [
			`ExistDB_UpdateExpr ::= 'update' (ExistDB_UpdateInsertExpr | ExistDB_UpdateReplaceExpr | ExistDB_UpdateDeleteExpr | ExistDB_UpdateRenameExpr | ExistDB_UpdateValueExpr)`,
			`ExistDB_UpdateInsertExpr ::= 'insert' Expr ( 'into' | 'following' | 'preceding' ) ExprSingle`,
			`ExistDB_UpdateReplaceExpr ::= 'replace' Expr 'with' ExprSingle`,
			`ExistDB_UpdateValueExpr ::= 'value' Expr 'with' ExprSingle`,
			`ExistDB_UpdateDeleteExpr ::= 'delete' Expr`,
			`ExistDB_UpdateRenameExpr ::= 'rename' Expr 'as' ExprSingle`,
		],
	},
];

export default existDBMutations;
