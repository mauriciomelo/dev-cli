import * as NodeGit from 'nodegit';
const path = require('path');

const pathTorepo = path.resolve('.');

const COMMIT_LIMIT = 100;
export async function getLastCommiters() {
  const repo = await NodeGit.Repository.open(pathTorepo);
  const revwalk = await NodeGit.Revwalk.create(repo);
  revwalk.pushHead();

  const commitList = await revwalk.getCommits(COMMIT_LIMIT);

  return commitList.map((c: NodeGit.Commit) => {
    return {
      name: c.committer().name(),
      email: c.committer().email(),
    };
  });
}
