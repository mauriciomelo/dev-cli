import { format, formatDuration, intervalToDuration } from 'date-fns';
import NodeGit from 'nodegit';
import { flatten } from 'ramda';
import * as fs from 'fs';
import * as os from 'os';
// @ts-ignore
import { parse } from 'json2csv';
import * as Influx from 'influx';
const path = require('path');

const pathTorepo = path.resolve('.');

type Change = {
  date: number;
  formatedDate: string;
  deployDate: number;
  leadTime: number;
  leadTimeInDays: number;
  formatedLeadTime: string;
  formatedDeployDate: string;
};

async function getChangeList(fromTag: string, toTag: string) {
  const repo = await NodeGit.Repository.open(pathTorepo);

  const from = await NodeGit.Revparse.single(repo, `tags/${fromTag}`);
  const to = await NodeGit.Revparse.single(repo, `tags/${toTag}`);

  const fromCommit = await getCommitFromTag(repo, from);
  const toCommit = await getCommitFromTag(repo, to);

  const revwalk = await NodeGit.Revwalk.create(repo);
  revwalk.push(toCommit.id());

  const commitList = await revwalk.getCommitsUntil(
    (commit: NodeGit.Object) => !commit.id().equal(fromCommit.id())
  );

  const deployDate = toCommit.timeMs();
  const changeList = commitList.map(commitToChange(deployDate));

  return changeList;
}

function commitToChange(deployDate: number) {
  const formatDate = (ms: number) => format(ms, 'MM/dd/yyyy HH:mm:ss');
  return (c: NodeGit.Commit): Change => ({
    date: c.timeMs(),
    formatedDate: formatDate(c.timeMs()),
    deployDate,
    formatedDeployDate: formatDate(deployDate),
    leadTime: deployDate - c.timeMs(),
    leadTimeInDays: msToDays(deployDate - c.timeMs()),
    formatedLeadTime: formatDuration(
      intervalToDuration({ start: c.timeMs(), end: deployDate })
    ),
  });
}

function msToDays(ms: number) {
  return ms / (1000 * 60 * 60 * 24);
}
async function getCommitFromTag(repo: NodeGit.Repository, obj: NodeGit.Object) {
  // @ts-ignore
  const isCommit = obj.type() == NodeGit.Object.TYPE.COMMIT;

  if (isCommit) return NodeGit.Commit.lookup(repo, obj.id());

  const tag = await NodeGit.Tag.lookup(repo, obj.id());
  const commit = await tag.target();
  return NodeGit.Commit.lookup(repo, commit.id());
}

async function getTags(limit: number) {
  const repo = await NodeGit.Repository.open(pathTorepo);
  const tagList = await Promise.all(
    (await NodeGit.Tag.list(repo)).map(async tagName => {
      const tag = await NodeGit.Revparse.single(repo, tagName);
      return {
        tag: tagName,
        date: (await getCommitFromTag(repo, tag)).timeMs(),
      };
    })
  );

  return tagList.sort((a, b) => (a.date < b.date ? 1 : -1)).splice(0, limit);
}

async function getLeadTime() {
  const tags = await getTags(RELEASE_COUNT);

  const changeListP = tags.reduce((acc: Promise<Change[]>[], tag, index) => {
    const toTag = tag.tag;
    const fromTag = tags[index + 1]?.tag;

    if (fromTag) {
      acc.push(getChangeList(fromTag, toTag));
    }

    return acc;
  }, []);

  const changeList: Change[] = flatten<Change>(await Promise.all(changeListP));

  const tagsCount = tags.length;
  const changesCount = changeList.length;

  const leadTimeSum = changeList.reduce((acc, c) => acc + c.leadTime, 0);
  const leadTimeAvg = leadTimeSum / changeList.length;

  const leadTimeInDays = msToDays(leadTimeAvg);

  console.log({ tagsCount, changesCount, leadTimeInDays });
  return changeList;
}

const RELEASE_COUNT = 100;

export interface Options {
  json: boolean;
  csv: boolean;
  influxdb: boolean;
}

export async function writePoints(options: Options) {
  const changeList = await getLeadTime();

  if (options.csv) {
    fs.writeFileSync('changes.csv', parse(changeList));
  }
  if (options.json) {
    fs.writeFileSync('changes.json', JSON.stringify(changeList, null, 2));
  }
  if (options.influxdb) {
    const DB_NAME = 'monitoring';
    const influx = new Influx.InfluxDB({
      host: 'localhost',
      database: DB_NAME,
      schema: [
        {
          measurement: 'lead_time_for_changes',
          fields: {
            leadTimeInDays: Influx.FieldType.FLOAT,
            deployDate: Influx.FieldType.INTEGER,
          },
          tags: ['host'],
        },
      ],
    });

    await influx.dropDatabase(DB_NAME);
    await influx.createDatabase(DB_NAME);

    changeList.forEach(c => {
      influx.writePoints([
        {
          measurement: 'lead_time_for_changes',
          tags: { host: os.hostname() },
          fields: {
            leadTimeInDays: c.leadTimeInDays,
            deployDate: c.deployDate,
          },
          timestamp: new Date(c.date),
        },
      ]);
    });

    const releases = await getTags(RELEASE_COUNT);

    releases.forEach(r => {
      influx.writePoints([
        {
          measurement: 'deploy_frequency',
          tags: { host: os.hostname() },
          fields: { tag: r.tag },
          timestamp: new Date(r.date),
        },
      ]);
    });
  }
}
