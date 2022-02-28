import * as shell from 'shelljs';
import { commit } from './commit';

// @ts-ignore
let execSpy = jest.spyOn(shell, 'exec').mockImplementation(() => ({ code: 0 }));
describe('commit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('build commit message', () => {
    commit({
      story: 'MM-000',
      message: 'test commit function',
      type: 'feat',
      amend: false,
      pairing: [],
    });

    const actualMessage = execSpy.mock.calls[0][0];

    expect(actualMessage).toEqual(
      'git commit  -m "feat(MM-000): test commit function :sparkles:"'
    );
  });

  it('adds co-authors', () => {
    commit({
      story: 'MM-000',
      message: 'test commit function',
      type: 'feat',
      amend: false,
      pairing: [
        'name <name@example.com>',
        'another-name <another-name@example.com>"',
      ],
    });

    const actualMessage = execSpy.mock.calls[0][0];

    expect(actualMessage).toContain(`Co-authored-by: name <name@example.com>`);
    expect(actualMessage).toContain(
      `Co-authored-by: another-name <another-name@example.com>`
    );
  });
});
