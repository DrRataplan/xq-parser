export type Mutation = {
	where: string;
	name: string;
	additionalRules: string[];
};

const existDBMutations: Mutation[] = [
	{
		where: 'Expr',
		name: 'ExistDB_UpdateInsertExpr',
		additionalRules: [
			`ExistDB_UpdateInsertExpr ::= 'update' 'insert' Expr ( 'into' | 'following' | 'preceding' ) ExprSingle`,
		],
	},
	{
		where: 'Expr',
		name: 'ExistDB_UpdateReplaceExpr',
		additionalRules: [`ExistDB_UpdateReplaceExpr ::= 'update' 'replace' Expr with ExprSingle`],
	},
	{
		where: 'Expr',
		name: 'ExistDB_UpdateDeleteExpr',
		additionalRules: [`ExistDB_UpdateDeleteExpr ::= 'update' 'delete' ExprSingle`],
	},
	{
		where: 'Expr',
		name: 'ExistDB_UpdateRenameExpr',
		additionalRules: [`ExistDB_UpdateRenameExpr ::= 'update' 'rename' Expr 'as' ExprSingle`],
	},
];

export default existDBMutations;
