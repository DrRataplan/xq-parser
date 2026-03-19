import type { Mutation, TokenMutation } from './mutations.ts';

// Hard: go into NonNCNameChar \\ only — never valid as names in update context.
const xqufHardKeywords: string[] = [
	'insert',
	'delete',
	'replace',
	'rename',
	'copy',
	'modify',
	'updating',
	'revalidation',
	'skip',
	'value',
	'of',
	'into',
	'before',
	'after',
	'first',
	'last',
	'with',
	'node',
	'nodes',
	'invoke',
];

export const xqufTokenMutations: TokenMutation[] = [
	{ where: 'NonNCNameChar', tokens: xqufHardKeywords },
	// Soft registration is handled in applyMutations via softKeywordsForNames
	// which adds them to NCName^Token << and QName^Token << directly.
];

export const xqufMutations: Mutation[] = [
	{
		where: 'ExprSingle',
		name: 'XQUF_UpdateExpr',
		additionalRules: [
			`XQUF_UpdateExpr ::= XQUF_InsertExpr | XQUF_DeleteExpr | XQUF_ReplaceExpr | XQUF_RenameExpr | XQUF_TransformExpr | XQUF_UpdatingFunctionCall`,

			// InsertExprTargetChoice: the original XQUF spec has
			//   ( ( 'as' ('first'|'last') )? 'into' ) | 'after' | 'before'
			// The optional ( 'as' ... )? before 'into' causes the 'as' lexical
			// ambiguity: after reducing SourceExpr (an ExprSingle), the lookahead
			// 'as' could be the optional keyword or the start of a QName expression.
			// Fix: expand into four explicit non-optional alternatives.
			`XQUF_InsertExpr ::= 'insert' ( 'node' | 'nodes' ) XQUF_SourceExpr XQUF_InsertExprTargetChoice XQUF_TargetExpr`,
			`XQUF_InsertExprTargetChoice ::= 'into' | XQUF_AsFirstInto | XQUF_AsLastInto | 'after' | 'before'`,
			`XQUF_AsFirstInto ::= 'as' 'first' 'into'`,
			`XQUF_AsLastInto  ::= 'as' 'last' 'into'`,
			`XQUF_SourceExpr  ::= ExprSingle`,
			`XQUF_TargetExpr  ::= ExprSingle`,

			`XQUF_DeleteExpr  ::= 'delete' ( 'node' | 'nodes' ) XQUF_TargetExpr`,

			`XQUF_ReplaceExpr ::= 'replace' XQUF_ReplaceTarget 'with' XQUF_NewExpr`,
			`XQUF_ReplaceTarget ::= 'value' 'of' 'node' XQUF_TargetExpr | 'node' XQUF_TargetExpr`,
			`XQUF_NewExpr      ::= ExprSingle`,

			`XQUF_RenameExpr   ::= 'rename' 'node' XQUF_TargetExpr 'as' XQUF_NewNameExpr`,
			`XQUF_NewNameExpr  ::= ExprSingle`,

			// CopyModifyExpr — the spec calls this "copy modify" expression
			// (also known as "transform" in XQUF 1.0)
			`XQUF_TransformExpr    ::= 'copy' XQUF_CopyBindingList 'modify' ExprSingle 'return' ExprSingle`,
			`XQUF_CopyBindingList  ::= XQUF_CopyBinding ( ',' XQUF_CopyBinding ) *`,
			`XQUF_CopyBinding      ::= '$' VarName ':=' ExprSingle`,

			// UpdatingFunctionCall — "invoke" "updating"? ExprSingle ArgumentList
			// XQUF 3.0 §5.5: invoke updating? <expr> ( args )
			`XQUF_UpdatingFunctionCall ::= 'invoke' 'updating' ExprSingle ArgumentList`,
		],
	},

	// AnnotatedDecl: add CompatibilityAnnotation support
	// XQUF 3.0 §4.2:
	//   AnnotatedDecl ::= "declare" (CompatibilityAnnotation | Annotation)* (VarDecl | FunctionDecl)
	//   CompatibilityAnnotation ::= "updating"
	// The base grammar's AnnotatedDecl ::= "declare" Annotation* (VarDecl | FunctionDecl)
	// already handles %updating via Annotation ::= '%' EQName (...).
	// We add CompatibilityAnnotation as an alternative in the Annotation* slot
	// by amending the AnnotatedDecl rule to also accept bare 'updating'.
	{
		where: 'AnnotatedDecl',
		name: 'XQUF_CompatibilityAnnotatedDecl',
		additionalRules: [
			// Bare 'updating' keyword before 'function' — backwards compat with XQUF 1.0
			`XQUF_CompatibilityAnnotatedDecl ::= 'declare' 'updating' 'function' EQName '(' ParamList ? ')' ( 'as' SequenceType ) ? ( FunctionBody | 'external' )`,
		],
	},

	{
		where: 'Setter',
		name: 'XQUF_RevalidationDecl',
		additionalRules: [`XQUF_RevalidationDecl ::= 'declare' 'revalidation' ( 'strict' | 'lax' | 'skip' )`],
	},

	{
		where: 'AnnotatedDecl',
		name: 'XQUF_UpdatingFunctionDecl',
		additionalRules: [
			`XQUF_UpdatingFunctionDecl ::= 'declare' 'updating' 'function' EQName '(' ParamList ? ')' ( 'as' SequenceType ) ? FunctionBody`,
		],
	},
];
