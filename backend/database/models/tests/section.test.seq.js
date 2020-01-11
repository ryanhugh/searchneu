import { sequelize, Course, Section } from '../index';

beforeAll(async () => {
  await Section.truncate({ cascade: true, restartIdentity: true });
  await Course.truncate({ cascade: true, restartIdentity: true });

  await Course.create({
    id: 'neu.edu/202030/CS/2500',
    host: 'neu.edu',
    classId: '2500',
    name: 'Fundamentals of Computer Science 1',
    termId: '202030',
    subject: 'CS',
    maxCredits: 4,
    minCredits: 4,
    desc: 'a good class',
    url: 'https://foo.com',
    prettyUrl: 'https://foo.com',
    lastUpdateTime: 123456789,
    classAttributes: ['hebloo'],
  });

  await Section.create({
    id: 'neu.edu/202030/CS/2500/19350',
    classHash: 'neu.edu/202030/CS/2500',
    seatsCapacity: 80,
    seatsRemaining: 0,
    waitCapacity: 0,
    waitRemaining: 0,
    online: false,
    honors: false,
    url: 'https://foo.com/19350',
    crn: '19350',
    meetings: [
      {
        startDate: 17903,
        endDate: 18013,
        profs: [
          'Benjamin Lerner',
        ],
        where: 'IV 010',
        type: 'Class',
        times: {
          4: [
            {
              start: 33600,
              end: 41400,
            },
          ],
        },
        allProfs: [
          'Benjamin Lerner',
          'Alan Mislove',
        ],
      },
    ],
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('toJSON', () => {
  it('generates the correct object', async () => {
    const section = await Section.findByPk('neu.edu/202030/CS/2500/19350');
    expect(section.toJSON()).toEqual({
      seatsCapacity: 80,
      seatsRemaining: 0,
      waitCapacity: 0,
      waitRemaining: 0,
      online: false,
      honors: false,
      url: 'https://foo.com/19350',
      crn: '19350',
      meetings: [
        {
          startDate: 17903,
          endDate: 18013,
          profs: [
            'Benjamin Lerner',
          ],
          where: 'IV 010',
          type: 'Class',
          times: {
            4: [
              {
                start: 33600,
                end: 41400,
              },
            ],
          },
          allProfs: [
            'Benjamin Lerner',
            'Alan Mislove',
          ],
        },
      ],
    });
  });
});
