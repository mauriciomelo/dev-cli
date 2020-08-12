import { parsePackage } from './parsePackageJson';

describe('alias', () => {
  it('adds first letter of the command as alias', () => {
    const pg = {
      scripts: {
        test: 'jest .',
        build: 'build',
      },
    };

    expect(parsePackage(pg)[0].alias).toEqual('t');
    expect(parsePackage(pg)[1].alias).toEqual('b');
  });

  it('adds first letter of each seaction by separator `:`', () => {
    const pg = {
      scripts: {
        'test:watch': 'jest --watch',
      },
    };

    expect(parsePackage(pg)[0].alias).toEqual('tw');
  });

  it('does not add duplicates', () => {
    const pg = {
      scripts: {
        test: 'jest',
        testing: 'echo testing',
      },
    };

    expect(parsePackage(pg)[0].alias).toEqual('t');
    expect(parsePackage(pg)[1].alias).toEqual(undefined);
  });
});
