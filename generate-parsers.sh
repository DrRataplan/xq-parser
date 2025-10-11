set -e

# First, XQuery 4
echo "Transforming XQuery 4"
node --experimental-strip-types ./src/index.ts ./rawgrammars/XQuery-40.ebnf > ./transformedgrammars/XQuery-40-full.ebnf
# Assume rex parser is here.
rex-parser-generator/rex/build/bin/rex -typescript ./transformedgrammars/XQuery-40-full.ebnf -glalr 1 -a pi -tree

# Prepend the ts-nocheck line and move to the correct place
cat parser_header.txt ./XQuery-40-full.ts > parsers/XQuery-40-full.ts
rm ./XQuery-40-full.ts



echo "Transforming XQuery 3"
# The 3.1 grammar / EBNF is manually maintained for now
# node --experimental-strip-types ./src/index.ts ./rawgrammars/XQuery-31.ebnf > ./transformedgrammars/XQuery-31-full.ebnf
# Assume rex parser is here.
rex-parser-generator/rex/build/bin/rex -typescript ./transformedgrammars/XQuery-31-full.ebnf -glalr 1 -a pi -tree
cat parser_header.txt ./XQuery-31-full.ts > parsers/XQuery-31-full.ts
rm ./XQuery-31-full.ts
