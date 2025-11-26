import { type TestContext, describe, it } from 'node:test';
import findCommentsInWhitespace from '../shared/findCommentsInWhitespace.ts';
import { Terminal } from '../shared/Node.ts';
import runParser from './runParser.ts';

const assertComments = (
	t: TestContext,
	actual: Terminal[],
	expected: { start: number; end: number; value: string }[]
) => {
	t.assert.equal(actual.length, expected.length, 'The same amount of comments should be there');

	for (let i = 0; i < actual.length; ++i) {
		const a = actual[i];
		const e = expected[i];
		t.assert.equal(a.start, e.start, `The start field must be equal for ${a}`);
		t.assert.equal(a.end, e.end, `The end field must be equal for ${a}`);
		t.assert.equal(a.value, e.value, `The value field must be equal for ${a}`);
	}
};

describe('findCommentsInWhitespace', () => {
	it('Finds nothing in pure whitespace', (t) => {
		const input = ' ';
		const result = findCommentsInWhitespace(input, 0);
		t.assert.deepEqual(result, [], 'No comments should be found');
	});

	it('Finds a single comment', (t) => {
		const input = '(: A :)';
		const result = findCommentsInWhitespace(input, 0);
		assertComments(t, result, [{ start: 0, end: 7, value: '(: A :)' }]);
	});

	it('Finds a single comment halfway the whitespace', (t) => {
		const input = '    (: A :)';
		const result = findCommentsInWhitespace(input, 0);
		assertComments(t, result, [{ start: 4, end: 11, value: '(: A :)' }]);
	});

	it('Finds a single comment halfway the script', (t) => {
		const input = '(: A :)';
		const result = findCommentsInWhitespace(input, 10);
		assertComments(t, result, [{ start: 10, end: 17, value: '(: A :)' }]);
	});

	it('finds two comments', (t) => {
		const input = '(: A :)  (: B :)';
		const result = findCommentsInWhitespace(input, 0);
		assertComments(t, result, [
			{ start: 0, end: 7, value: '(: A :)' },
			{ start: 9, end: 16, value: '(: B :)' },
		]);
	});

	it('finds two comments directly adjacent', (t) => {
		const input = '(: A :)(: B :)';
		const result = findCommentsInWhitespace(input, 0);
		assertComments(t, result, [
			{ start: 0, end: 7, value: '(: A :)' },
			{ start: 7, end: 14, value: '(: B :)' },
		]);
	});

	it('handles nested comments', (t) => {
		const input = '(: A (: B :) :)';
		const result = findCommentsInWhitespace(input, 0);
		assertComments(t, result, [{ start: 0, end: 15, value: '(: A (: B :) :)' }]);
	});

	describe('context-aware', () => {
		it('can detect comments in normal whitespace', (t) => {
			const input = '(: A :) 1';
			const result = runParser(input, 3);

			assertComments(t, result.comments, [{ start: 0, end: 7, value: '(: A :)' }]);
		});

		it('Ignores comments where whitespace is explicit', (t) => {
			const input = '<ele>(: A :) {} 1</ele>';
			const result = runParser(input, 3);
			assertComments(t, result.comments, []);
		});

		it('detects correctly in bigger scripts', (t) => {
			const input = `<html>
  <body>
    <table>
      <tr> (: Column headings :)
         {
          <th />,
          for $th in
            json-doc(
              "http://www.w3.org/qt3/app/UseCaseR31/table-json"
            )?col-labels?*
          return <th>{ $th }</th>
        }
      </tr>
      { (: Data for each row :)
        for $r at $i in
          json-doc("http://www.w3.org/qt3/app/UseCaseR31/table-json")?data?*
        return <tr>
          {
            <th>
              {
                json-doc(
                  "http://www.w3.org/qt3/app/UseCaseR31/table-json"
                )?row-labels[$i]
              }
            </th>,
            for $c in $r?*
            return <td>{ $c }</td>
          }
        </tr>
      }
    </table>
  </body>
</html>`;
			const result = runParser(input, 3);
			assertComments(t, result.comments, [{ start: 288, end: 311, value: '(: Data for each row :)' }]);
		});
	});
});
