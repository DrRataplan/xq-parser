// Mutation: rewrites a syntax or lexical rule body by prepending a new
// named alternative. Used for ExprSingle, NCName, FunctionName, etc.
export type Mutation = {
	where: string | string[];
	name: string;
	additionalRules: string[];
};

// TokenMutation: appends keyword strings directly to a token directive
// production (NonNCNameChar \\, NCName^Token <<, QName^Token <<).
// These directives are flat lists of terminals with no '|' operator,
// so the standard Mutation wrapping of `name | ( ... )` is wrong for them.
export type TokenMutation = {
	where: string | string[];
	tokens: string[];
};
