import { createTestClient } from 'apollo-server-testing';
import { gql } from 'apollo-server';
import elastic from '../../elastic';
import server from '../index';
import mapping from '../../scrapers/classes/classMapping.json';

const { query } = createTestClient(server);

beforeAll(async () => {
  elastic.CLASS_INDEX = 'testclasses';
  await elastic.resetIndex(elastic.CLASS_INDEX, mapping);
  await elastic.bulkIndexFromMap(elastic.CLASS_INDEX, {
    'neu.edu/201930/CS/2500': {
      class: {
        host: 'neu.edu',
        termId: '201930',
        subject: 'CS',
        classId: '2500',
        name: 'Fundamentals of Computer Science 1',
      },
    },
    'neu.edu/201830/CS/2500': {
      class: {
        host: 'neu.edu',
        termId: '201830',
        subject: 'CS',
        classId: '2500',
        name: 'Fundamentals of Computer Science 1',
      },
    },
  });
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
  console.log(JSON.stringify(res));
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
