import { createTestClient } from 'apollo-server-testing';
import { gql } from 'apollo-server';
import server from '../index';
import db from '../../../models/index';

const { query } = createTestClient(server);
const MajorData = db.MajorData;


beforeAll(async () => {
  await MajorData.create({
    majorId: 'computer-information-science/computer-science/bscs',
    catalogYear: 2018,
    name: 'Computer Science',
    requirements: { name: 'Computer Science, BSCS', yearVersion: 2018 },
    plansOfStudy: [ { years: [ 1000 ] , id: '0' } ],
  });

  await MajorData.create({
    majorId: 'computer-information-science/computer-science/bscs',
    catalogYear: 2017,
    name: 'Computer Science',
    requirements: { name: 'Computer Science, BSCS', yearVersion: 2017 },
    plansOfStudy: [ { years: [ 1000 ], id: '0' } ],
  });

  await MajorData.create({
    majorId: 'science/biochemistry/biochemistry-bs',
    catalogYear: 2018,
    name: 'Biochemistry',
    requirements: { name: 'Biochemistry, BS', yearVersion: 2018 },
    plansOfStudy: [ { years: [ 1000 ], id: '0' } ],
  });
});

it('gets major from majorId', async () => {
  const res = await query({
    query: gql`
      query major {
        major(majorId: "computer-information-science/computer-science/bscs") {
          name
        }
      }
    `;
  });
  expect(res).toMatchSnapshot();
});

it('gets specific occurrence', async () => {
  const res = await query({
    query: gql`
      query major {
        major(majorId: "computer-information-science/computer-science/bscs") {
          name
          occurrence(year: 2017) {
            catalogYear
            requirements
            plansOfStudy
          }
        }
      }
    `;
  });
});

it('gets latest occurrence', async () => {
  const res = await query({
    query: gql`
      query major {
        major(majorId: "computer-information-science/computer-science/bscs") {
        name
        latestOccurrence {
          catalogYear
          requirements
        }
        }
      }
    `;
  });
});
