/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import dumpProcessor from '../dumpProcessor';
import db from '../database/models/index';

const Professor = db.Professor;
const Course = db.Course;
const Section = db.Section;

beforeAll(() => {
  dumpProcessor.CHUNK_SIZE = 2;
  Course.removeHook('afterBulkUpdate', 
});

beforeEach(async () => {
  await Professor.truncate({ cascade: true, restartIdentity: true });
  await Section.truncate({ cascade: true, restartIdentity: true });
  await Course.truncate({ cascade: true, restartIdentity: true });
});

afterAll(async () => {
  await db.sequelize.close();
});

it('does not create records if dump is empty', async () => {
  const prevCounts = Promise.all([Professor.count(), Course.count(), Section.count()]);
  await dumpProcessor.main({ termDump: { classes: [], sections: [] } });
  expect(Promise.all([Professor.count(), Course.count(), Section.count()])).toEqual(prevCounts);
});

describe('with professors', () => {
  it('creates professors', async () => {
    const profDump = {
      firstProf: {
        id: 'abcdefg',
        name: 'Benjamin Lerner',
        firstName: 'Benjamin',
        lastName: 'Lerner',
        phone: '6173732462',
        profId: 'qnCb2rE37jBVGwPZJ%2BmhIg%3D%3D',
        emails: ['be.lerner@northeastern.edu', 'blerner@ccs.neu.edu'],
        primaryRole: 'Assistant Teaching Professor',
        primaryDepartment: 'Khoury',
        url: 'https://www.khoury.northeastern.edu/people/benjamin-lerner/',
        personalSite: 'http://www.ccs.neu.edu/home/blerner/',
        bigPictureUrl: 'https://www.khoury.northeastern.edu/wp-content/uploads/2016/02/Benjamin-Lerner-hero-image.jpg',
      },
      secondProf: {
        id: 'hijklmnop',
        name: 'Neal Lerner',
        firstName: 'Neal',
        lastName: 'Lerner',
        phone: '6173732451',
        profId: 'IhhKL%2BkX586x52IdGT5mRQ%3D%3D',
        emails: ['n.lerner@northeastern.edu'],
        primaryRole: 'Professor & Chair',
        primaryDepartment: 'English',
      },
      thirdProf: {
        id: 'qrstuv',
        name: 'Alan Mislove',
        firstName: 'Alan',
        lastName: 'Mislove',
        phone: '6173737069',
        profId: 'c69LPTvUpGHXJaH73AeRmg%3D%3D',
        emails: ['a.mislove@northeastern.edu', 'amislove@ccs.neu.edu'],
        primaryRole: 'Professor',
        primaryDepartment: 'Khoury',
        url: 'https://www.khoury.northeastern.edu/people/alan-mislove/',
        personalSite: 'https://mislove.org',
        googleScholarId: 'oAqKi9MAAAAJ',
        bigPictureUrl: 'https://www.khoury.northeastern.edu/wp-content/uploads/2016/02/Alan-Mislove_cropped-hero-image.jpg',
      },
    };

    await dumpProcessor.main({ termDump: { classes: [], sections: [] }, profDump: profDump });
    expect(await Professor.count()).toEqual(3);
  });
});

describe('with classes', () => {
  it('creates classes', async () => {
    const termDump = {
      sections: [],
      classes: [
        {
          id: 'neu.edu/202030/CS/2500',
          maxCredits: 4,
          minCredits: 4,
          host: 'neu.edu',
          classId: '2500',
          name: 'Fundamentals Of Computer Science 1',
          termId: '202030',
          subject: 'CS',
          prereqs: { type: 'and', values: [] },
          coreqs: { type: 'and', values: [{ subject: 'CS', classId: '2501' }] },
          prereqsFor: { type: 'and', values: [] },
          optPrereqsFor: { type: 'and', values: [] },
          classAttributes: ['fun intro'],
          lastUpdateTime: 123456789,
        },
        {
          id: 'neu.edu/202030/CS/2510',
          maxCredits: 4,
          minCredits: 4,
          host: 'neu.edu',
          classId: '2510',
          name: 'Fundamentals Of Computer Science 2',
          termId: '202030',
          subject: 'CS',
          prereqs: { type: 'and', values: [] },
          coreqs: { type: 'and', values: [] },
          prereqsFor: { type: 'and', values: [] },
          optPrereqsFor: { type: 'and', values: [] },
          lastUpdateTime: 123456789,
        },
        {
          id: 'neu.edu/202030/CS/3500',
          maxCredits: 4,
          minCredits: 4,
          host: 'neu.edu',
          classId: '3500',
          name: 'Object-Oriented Design',
          termId: '202030',
          subject: 'CS',
          lastUpdateTime: 123456789,
        },
      ],
    };

    await dumpProcessor.main({ termDump: termDump });
    expect(await Course.count()).toEqual(3);
  });
});

describe('with sections', () => {
  beforeEach(async () => {
    await Course.create({
      id: 'neu.edu/202030/CS/3500',
      maxCredits: 4,
      minCredits: 4,
      classId: '3500',
      name: 'Object-Oriented Design',
      termId: '202030',
      subject: 'CS',
      lastUpdateTime: 123456789,
    });
  });

  it('creates sections', async () => {
    const termDump = {
      classes: [],
      sections: [
        {
          host: 'neu.edu',
          termId: '202030',
          subject: 'CS',
          classId: '3500',
          seatsCapacity: 50,
          seatsRemaining: 0,
          waitCapacity: 0,
          waitRemaining: 0,
          online: false,
          honors: false,
          crn: '12345',
          meetings: {},
        },
        {
          host: 'neu.edu',
          termId: '202030',
          subject: 'CS',
          classId: '3500',
          seatsCapacity: 40,
          seatsRemaining: 10,
          online: false,
          honors: false,
          crn: '23456',
          meetings: {},
        },
        {
          host: 'neu.edu',
          termId: '202030',
          subject: 'CS',
          classId: '3500',
          seatsCapacity: 2,
          seatsRemaining: 2,
          online: false,
          honors: false,
          crn: '34567',
          meetings: {},
        },
      ],
    };

    await dumpProcessor.main({ termDump: termDump });
    expect(await Section.count()).toEqual(3);
  });
});

describe('with updates', () => {
  beforeEach(async () => {
    await Course.create({
      id: 'neu.edu/202030/CS/3500',
      maxCredits: 4,
      minCredits: 4,
      classId: '3500',
      name: 'Object-Oriented Design',
      termId: '202030',
      subject: 'CS',
      lastUpdateTime: 123456789,
    });

    await Section.create({
      id: 'neu.edu/202030/CS/3500/34567',
      seatsCapacity: 2,
      seatsRemaining: 2,
      online: false,
      honors: false,
      crn: '34567',
      meetings: {},
    });
  });

  it('updates fields for courses', async () => {
    const termDump = {
      sections: [],
      classes: [
        {
          id: 'neu.edu/202030/CS/3500',
          maxCredits: 4,
          minCredits: 4,
          host: 'neu.edu',
          classId: '3500',
          name: 'Compilers',
          termId: '202030',
          subject: 'CS',
          lastUpdateTime: 123456789,
        },
      ],
    };

    await dumpProcessor.main({ termDump: termDump });
    expect(await Course.count()).toEqual(1);
    expect(await Section.count()).toEqual(1);
    expect((await Course.findByPk('neu.edu/202030/CS/3500')).name).toEqual('Compilers');
  });
});
