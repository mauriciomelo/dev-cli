const conventionalCommitsParser = require('conventional-commits-parser');
const NodeGit = require('nodegit');
const path = require('path');

const pathTorepo = path.resolve('.');

module.exports = {
  async getMyLastCommitScope() {
    const myEmail = await getMyEmail();
    const myLastCommit = await getLastCommitByEmail(myEmail);

    if (myLastCommit) {
      const { scope } = conventionalCommitsParser.sync(myLastCommit.message());
      return scope;
    }
  },
};

async function getLastCommitByEmail(email) {
  const repo = await NodeGit.Repository.open(pathTorepo);
  const revwalk = await NodeGit.Revwalk.create(repo);
  revwalk.pushHead();

  const commitList = await revwalk.getCommits(30);

  return commitList.find(c => {
    const commiterEmail = c.committer().email();
    return commiterEmail === email;
  });
}

async function getMyEmail() {
  const config = await NodeGit.Config.openDefault();
  const userEmail = (await config.getEntry('user.email')).value();
  return userEmail;
}
