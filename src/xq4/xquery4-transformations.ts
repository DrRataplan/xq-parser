import type { Mutation, TokenMutation } from './mutations.ts';

// ─── eXist-DB mutations for XQuery 4 ─────────────────────────────────────────
//
// XQuery 4 differences from XQuery 3.1:
//
//   • No AnnotatedDecl — VarDecl/FunctionDecl live directly in Prolog
//   • No NCName^Token << / QName^Token << — token system uses:
//       QNameOrKeywordDelimiter \\ ...  (Delimiter node)
//       NCNameDelimiter \\ UnreservedNCName  (Delimiter node)
//   • ReservedName is an explicit lexical rule — add hard keywords here
//   • NCName rule body contains all soft keywords directly
//   • No NonNCNameChar — use QNameOrKeywordDelimiter instead
//   • >> preferences not needed — ReservedName exclusion handles it

// Hard keywords: add to QNameOrKeywordDelimiter \\ AND ReservedName rule body.
// These must never be usable as names.
const existDBHardKeywords: string[] = ['insert', 'delete', 'replace', 'rename', 'value'];

// Soft keywords: add to QNameOrKeywordDelimiter \\ AND NCName rule body.
// These remain usable as names via NCName.
const existDBSoftKeywords: string[] = ['update', 'into', 'with'];

export const existDBTokenMutationsXQ4: TokenMutation[] = [
	// Register all eXist keywords with the delimiter so REX knows they
	// are keyword terminals requiring a delimiter to follow.
	{ where: 'QNameOrKeywordDelimiter', tokens: [...existDBHardKeywords, ...existDBSoftKeywords] },
];

export const existDBMutationsXQ4: Mutation[] = [
	// Add ALL eXist keywords to ReservedName so they are excluded from
	// UnreservedQName (= QName - ReservedName). Without this, 'update' and
	// 'with' remain valid UnreservedQName tokens and REX sees them as
	// ambiguous with the keyword terminals.
	// Being in ReservedName does NOT prevent use as NCName — the NCName rule
	// body in XQuery 4 lists keywords explicitly as direct alternatives
	// (bypassing UnreservedNCName), so adding them to ExistDB_NCName below
	// keeps them valid as names.
	{
		where: 'ReservedName',
		name: 'ExistDB_ReservedName',
		additionalRules: [
			`ExistDB_ReservedName ::= 'update' | 'insert' | 'delete' | 'replace' | 'rename' | 'value' | 'into' | 'with'`,
		],
	},

	// Add soft keywords to NCName rule body so they remain valid as names
	// even though they are in ReservedName (excluded from UnreservedNCName).
	// XQuery 4's NCName rule lists keywords as explicit alternatives alongside
	// UnreservedNCName, so this is the correct extension point.
	{
		where: 'NCName',
		name: 'ExistDB_NCName',
		additionalRules: [`ExistDB_NCName ::= 'update' | 'into' | 'with'`],
	},

	// Inject update expressions into ExprSingle.
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
			`ExistDB_UpdateRenameExpr  ::= 'rename' ExprSingle 'as' ExprSingle`,
		],
	},
];

// ─── XQUF mutations for XQuery 4 ─────────────────────────────────────────────

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
	'of',
	'into',
	'before',
	'after',
	'first',
	'last',
	'node',
	'nodes',
	'invoke',
];

const xqufSoftKeywords: string[] = ['with'];

export const xqufTokenMutationsXQ4: TokenMutation[] = [
	{ where: 'QNameOrKeywordDelimiter', tokens: [...xqufHardKeywords, ...xqufSoftKeywords] },
];

export const xqufMutationsXQ4: Mutation[] = [
	// All XQUF keywords go into ReservedName to exclude from UnreservedQName.
	{
		where: 'ReservedName',
		name: 'XQUF_ReservedName',
		additionalRules: [
			`XQUF_ReservedName ::= 'insert' | 'delete' | 'replace' | 'rename' | 'copy' | 'modify' | 'updating' | 'revalidation' | 'skip' | 'of' | 'into' | 'before' | 'after' | 'first' | 'last' | 'node' | 'nodes' | 'invoke' | 'with'`,
		],
	},

	// Soft XQUF keywords remain usable as names via NCName body.
	{
		where: 'NCName',
		name: 'XQUF_NCName',
		additionalRules: [`XQUF_NCName ::= 'with'`],
	},

	// ExprSingle: inject XQUF update expressions
	{
		where: 'ExprSingle',
		name: 'XQUF_UpdateExpr',
		additionalRules: [
			`XQUF_UpdateExpr ::= XQUF_InsertExpr | XQUF_DeleteExpr | XQUF_ReplaceExpr | XQUF_RenameExpr | XQUF_TransformExpr | XQUF_UpdatingFunctionCall`,

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

			`XQUF_TransformExpr    ::= 'copy' XQUF_CopyBindingList 'modify' ExprSingle 'return' ExprSingle`,
			`XQUF_CopyBindingList  ::= XQUF_CopyBinding ( ',' XQUF_CopyBinding ) *`,
			`XQUF_CopyBinding      ::= '$' EQName ':=' ExprSingle`,

			`XQUF_UpdatingFunctionCall ::= 'invoke' 'updating' ExprSingle ArgumentList`,
		],
	},

	// Setter: RevalidationDecl
	{
		where: 'Setter',
		name: 'XQUF_RevalidationDecl',
		additionalRules: [`XQUF_RevalidationDecl ::= 'declare' 'revalidation' ( 'strict' | 'lax' | 'skip' )`],
	},

	// FunctionDecl: %updating annotation is already handled by XQuery 4's
	// Annotation* in FunctionDecl. The bare 'updating' keyword compat form
	// needs a separate rule since XQuery 4 has no AnnotatedDecl.
	{
		where: 'FunctionDecl',
		name: 'XQUF_UpdatingFunctionDecl',
		additionalRules: [
			`XQUF_UpdatingFunctionDecl ::= 'declare' 'updating' 'function' UnreservedFunctionEQName '(' ParamListWithDefaults ? ')' TypeDeclaration ? ( FunctionBody | 'external' )`,
		],
	},
];
