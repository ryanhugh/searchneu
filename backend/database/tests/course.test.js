import { sequelize, Course, Section } from '../models/index';
import elastic from '../../elastic';

let sections;
let expected;

beforeAll(async () => {
  await Section.truncate({ cascade: true, restartIdentity: true });
  await Course.truncate({ cascade: true, restartIdentity: true });

  jest.spyOn(elastic, 'bulkIndexFromMap').mockImplementation(() => {});

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
        where: "IV 010",
        type: "Class",
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

  await Section.create({
    id: 'neu.edu/202030/CS/2500/19360',
    classHash: 'neu.edu/202030/CS/2500',
    seatsCapacity: 80,
    seatsRemaining: 5,
    waitCapacity: 10,
    waitRemaining: 2,
    online: false,
    honors: false,
    url: 'https://foo.com/19360',
    crn: '19360',
    meetings: [
      {
        startDate: 17903,
        endDate: 18013,
        profs: [
          'Alan Mislove',
        ],
        where: "West Village G 010",
        type: "Class",
        times: {
          2: [
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

beforeEach(() => {
  sections = [
    {
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
          where: "IV 010",
          type: "Class",
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
      lastUpdateTime: 123456789,
      termId: '202030',
      host: 'neu.edu',
      subject: 'CS',
      classId: '2500',
    },
    {
      seatsCapacity: 80,
      seatsRemaining: 5,
      waitCapacity: 10,
      waitRemaining: 2,
      online: false,
      honors: false,
      url: 'https://foo.com/19360',
      crn: '19360',
      meetings: [
        {
          startDate: 17903,
          endDate: 18013,
          profs: [
            'Alan Mislove',
          ],
          where: "West Village G 010",
          type: "Class",
          times: {
            2: [
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
      lastUpdateTime: 123456789,
      termId: '202030',
      host: 'neu.edu',
      subject: 'CS',
      classId: '2500',
    },
  ];

  expected = {
    'neu.edu/202030/CS/2500': {
      "class": {
        crns: ['19350', '19360'],
        classAttributes: ['hebloo'],
        maxCredits: 4,
        minCredits: 4,
        desc: 'a good class',
        classId: '2500',
        prettyUrl: 'https://foo.com',
        url: 'https://foo.com',
        name: 'Fundamentals of Computer Science 1',
        lastUpdateTime: 123456789,
        termId: '202030',
        host: 'neu.edu',
        subject: 'CS',
        sections: sections,
      },
      sections: sections,
    },
  };
});

describe('bulkUpsertEs', () => {
  it('upserts to ES', async () => {
    const course = await Course.findByPk('neu.edu/202030/CS/2500');
    await Course.bulk_upsert_es([course]);

    expect(elastic.bulkIndexFromMap).toHaveBeenCalledWith(elastic.CLASS_INDEX, expected);
  });

  it('includes prerequisites and corequisites if they exist', async () => {
    const id = 'neu.edu/202030/CS/2500';

    // obviously...
    const prereqs = {
      type: 'and',
      values: [
        {
          subject: 'CS',
          classId: '2510',
        },
      ],
    };

    const coreqs = {
      type: 'and',
      values: [
        {
          subject: 'CS',
          classId: '2501',
        },
      ],
    };

    const prereqsFor = {
      values: [
        {
          subject: 'CS',
          classId: '2510',
        },
        {
          subject: 'CS',
          classId: '2800',
        },
      ],
    };

    const optPrereqsFor = {
      values: [
        {
          subject: 'CS',
          classId: '3200',
        },
      ],
    };

    await Course.update({ 
      prereqs: prereqs,
      coreqs: coreqs,
      prereqsFor: prereqsFor,
      optPrereqsFor: optPrereqsFor,
    }, { where: { id: 'neu.edu/202030/CS/2500' } });

    expected[id]["class"].prereqs = prereqs;
    expected[id]["class"].coreqs = coreqs;
    expected[id]["class"].prereqsFor = prereqsFor;
    expected[id]["class"].optPrereqsFor = optPrereqsFor;

    const course = await Course.findByPk('neu.edu/202030/CS/2500');
    await Course.bulk_upsert_es([course]);

    expect(elastic.bulkIndexFromMap).toHaveBeenCalledWith(elastic.CLASS_INDEX, expected);
  });
});
