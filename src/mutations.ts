export type Mutation = {
	where: string;
	name: string;
	additionalRules: string[];
};

const existDBMutations: Mutation[] = [
	{
		where: 'Expr',
		name: 'ExistDB_UpdateExpr',
		additionalRules: [
			`ExistDB_UpdateExpr ::= 'update' 'insert' Expr ( 'into' | 'following' | 'preceding' ) ExprSingle`,
		],
	},
];

export default existDBMutations;
