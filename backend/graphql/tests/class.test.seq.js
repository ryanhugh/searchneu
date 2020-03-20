import { createTestClient } from 'apollo-server-testing';
import { gql } from 'apollo-server';
import server from '../index';
import { Course, Section, sequelize } from '../../database/models/index';

const { query } = createTestClient(server);

beforeAll(async () => {
  await Section.truncate({ cascade: true, restartIdentity: true });
  await Course.truncate({ cascade: true, restartIdentity: true });
  await Course.create({
    id: 'neu.edu/201930/CS/2500',
    host: 'neu.edu',
    termId: '201930',
    subject: 'CS',
    classId: '2500',
    name: 'Fundamentals of Computer Science 1',
    lastUpdateTime: new Date()
  });

  await Course.create({
    id: 'neu.edu/201830/CS/2500',
    host: 'neu.edu',
    termId: '201830',
    subject: 'CS',
    classId: '2500',
    name: 'Fundamentals of Computer Science 1',
    lastUpdateTime: new Date()
  });
});

afterAll(async () => {
  await sequelize.close();
});

it('gets all occurrences', async () => {
  const res = await query({
    query: gql`
      query class {
        class(subject: "CS", classId: 2500) {
          name
          allOccurrences {
            termId
          }
        }
      }
    `,
  });
  expect(res).toMatchSnapshot();
});

it('gets latest occurrence', async () => {
  const res = await query({
    query: gql`
      query class {
        class(subject: "CS", classId: 2500) {
          name
          latestOccurrence {
            termId
          }
        }
      }
    `,
  });
  expect(res).toMatchSnapshot();
});

it('gets specific occurrence', async () => {
  const res = await query({
    query: gql`
      query class {
        class(subject: "CS", classId: 2500) {
          name
          occurrence(termId: 201930) {
            termId
          }
        }
      }
    `,
  });
  expect(res).toMatchSnapshot();
});

it('gets the name of class from subject and classId', async () => {
  const res = await query({
    query: gql`
      query class {
        class(subject: "CS", classId: 2500) {
          name
        }
      }
    `,
  });
  expect(res).toMatchSnapshot();
});
