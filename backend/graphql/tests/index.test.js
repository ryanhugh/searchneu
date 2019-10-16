import { createTestClient } from 'apollo-server-testing';
import { gql } from 'apollo-server';
import server from '../index';

const { query } = createTestClient(server);

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
