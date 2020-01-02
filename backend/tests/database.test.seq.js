import database from '../database';
import db from '../database/models/index';

const { User, Section, Course, FollowedSection, FollowedCourse } = db;

// Note when testing here: The database is not reset between tests.

// specs I want:
// one test to make sure a user is found and the json is generated properly
// one test to make sure we handle failed-to-find gracefully (or decide on it)
//
// one test to make sure getByLoginKey works and finds
// one test to make sure it fails gracefully

// in jest config, maybe disable Sequelize output?

beforeEach(async () => {
  await FollowedSection.truncate({ cascade: true, restartIdentity: true });
  await FollowedCourse.truncate({ cascade: true, restartIdentity: true });
  await User.truncate({ cascade: true, restartIdentity: true });
  await Section.truncate({ cascade: true, restartIdentity: true });
  await Course.truncate({ cascade: true, restartIdentity: true });

  await Course.create({
    id: 'neu.edu/202030/CS/2500',
    host: 'neu.edu',
    classId: '2500',
    name: 'Fundamentals of Computer Science 1',
    termId: '202030',
    subject: 'CS',
  });

  await Course.create({
    id: 'neu.edu/202030/CS/2510',
    host: 'neu.edu',
    classId: '2510',
    name: 'Fundamentals of Computer Science 2',
    termId: '202030',
    subject: 'CS',
  });

  await Course.create({
    id: 'neu.edu/202030/CS/3500',
    host: 'neu.edu',
    classId: '3500',
    name: 'Object-Oriented Design',
    termId: '202030',
    subject: 'CS',
  });

  await Section.create({
    id: 'neu.edu/202030/CS/2500/19350',
    classHash: 'neu.edu/202030/CS/2500',
    seatsCapacity: 80,
    seatsRemaining: 0,
  });

  await Section.create({
    id: 'neu.edu/202030/CS/2500/19360',
    classHash: 'neu.edu/202030/CS/2500',
    seatsCapacity: 80,
    seatsRemaining: 5,
  });

  await Section.create({
    id: 'neu.edu/202030/CS/3500/20350',
    classHash: 'neu.edu/202030/CS/3500',
    seatsCapacity: 100,
    seatsRemaining: 0,
  });

  await User.create({
    id: '123456789',
    facebookPageId: '23456',
    firstName: 'Wilbur',
    lastName: 'Whateley',
    loginKeys: ['the key', 'the gate'],
  });

  await FollowedSection.create({
    userId: '123456789',
    sectionId: 'neu.edu/202030/CS/2500/19350',
  });

  await FollowedCourse.create({
    userId: '123456789',
    courseId: 'neu.edu/202030/CS/3500',
  });
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('set', () => {
  it('creates a user if user does not exist', async () => {
    expect(await User.findByPk('33')).toBe(null);
    expect(await FollowedSection.count({ where: { userId: '33' } })).toBe(0);
    expect(await FollowedCourse.count({ where: { userId: '33' } })).toBe(0);
    await database.set('33', {
      facebookPageId: '37', 
      firstName: 'Erich', 
      lastName: 'Zann', 
      loginKeys: ['not the key'], 
      watchingSections: ['neu.edu/202030/CS/3500/20350'],
      watchingClasses: ['neu.edu/202030/CS/3500'],
    });

    expect((await User.findByPk('33')).facebookPageId).toBe('37');
    expect((await FollowedSection.findOne({ where: { userId: '33' } })).sectionId).toBe('neu.edu/202030/CS/3500/20350');
    expect((await FollowedCourse.findOne({ where: { userId: '33' } })).courseId).toBe('neu.edu/202030/CS/3500');
  });

  it('updates a user if user exists', async () => {
    expect(await User.count({ where: { id: '123456789' } })).toEqual(1);  
    expect(await FollowedSection.count({ where: { userId: '123456789' } })).toBe(1);
    expect(await FollowedCourse.count({ where: { userId: '123456789' } })).toBe(1);
    await database.set('123456789', {
      facebookPageId: '76543',
      loginKeys: ['abcdefg'],
    });

    expect((await User.findByPk('123456789')).facebookPageId).toBe('76543');
  });

  it('updates the followed sections for a user', async () => {
    expect((await FollowedSection.findOne({ where: { userId: '123456789' } })).sectionId).toBe('neu.edu/202030/CS/2500/19350');
    await database.set('123456789', {
      watchingSections: ['neu.edu/202030/CS/2500/19360', 'neu.edu/202030/CS/3500/20350'],
    });

    expect(await FollowedSection.count({ where: { userId: '123456789', sectionId: 'neu.edu/202030/CS/2500/19350' } })).toBe(0);
    expect(await FollowedSection.count({ where: { userId: '123456789', sectionId: 'neu.edu/202030/CS/2500/19360' } })).toBe(1);
    expect(await FollowedSection.count({ where: { userId: '123456789', sectionId: 'neu.edu/202030/CS/3500/20350' } })).toBe(1);
    expect(await FollowedSection.count({ where: { userId: '123456789' } })).toBe(2);
  });

  it('updates the followed courses for a user', async () => {
    expect((await FollowedCourse.findOne({ where: { userId: '123456789' } })).courseId).toBe('neu.edu/202030/CS/3500');
    await database.set('123456789', {
      watchingClasses: ['neu.edu/202030/CS/2500', 'neu.edu/202030/CS/2510'],
    });

    expect(await FollowedCourse.count({ where: { userId: '123456789', courseId: 'neu.edu/202030/CS/3500' } })).toBe(0);
    expect(await FollowedCourse.count({ where: { userId: '123456789', courseId: 'neu.edu/202030/CS/2500' } })).toBe(1);
    expect(await FollowedCourse.count({ where: { userId: '123456789', courseId: 'neu.edu/202030/CS/2510' } })).toBe(1);
    expect(await FollowedCourse.count({ where: { userId: '123456789' } })).toBe(2);
  });
});

describe('get', () => {
  it('gets an existing user', async () => {
    const foundUser = await database.get('123456789');

    expect(foundUser).toStrictEqual({
      facebookMessengerId: '123456789',
      facebookPageId: '23456',
      firstName: 'Wilbur',
      lastName: 'Whateley',
      loginKeys: ['the key', 'the gate'],
      watchingSections: ['neu.edu/202030/CS/2500/19350'],
      watchingClasses: ['neu.edu/202030/CS/3500'],
    });
  });

  it('returns null if no user found', async () => {
    const foundUser = await database.get('33');

    expect(foundUser).toBe(null);
  });
});

describe('getByLoginKey', () => {
  it('gets an existing user', async () => {
    const foundUser = await database.getByLoginKey('the key');

    expect(foundUser).toStrictEqual({
      facebookMessengerId: '123456789',
      facebookPageId: '23456',
      firstName: 'Wilbur',
      lastName: 'Whateley',
      loginKeys: ['the key', 'the gate'],
      watchingSections: ['neu.edu/202030/CS/2500/19350'],
      watchingClasses: ['neu.edu/202030/CS/3500'],
    });
  });

  it('returns null if no user found', async () => {
    const foundUser = await database.getByLoginKey('memes');

    expect(foundUser).toBe(null);
  });
});
