import { Op } from 'sequelize';
import { sequelize, Professor } from '../index';
import elastic from '../../../elastic';

let expected;

beforeEach(async () => {
  await Professor.truncate({ cascade: true, restartIdentity: true });

  jest.spyOn(elastic, 'bulkIndexFromMap').mockImplementation(() => {});

  await Professor.create({
    id: '12345',
    name: 'Ben Lerner',
    firstName: 'Ben',
    lastName: 'Lerner',
    phone: '123-456-7890',
    emails: [
      'ben.lerner@northeastern.edu',
      'blerner@ccs.neu.edu',
    ],
    primaryRole: 'Professor',
    primaryDepartment: 'Khoury',
    url: 'https://blerner.com',
    personalSite: 'https://blernersite.com',
  });

  await Professor.create({
    id: '67890',
    name: 'Matthias Felleisen',
    firstName: 'Matthias',
    lastName: 'Felleisen',
    phone: '098-765-4321',
    emails: [
      'mattias@ccs.neu.edu',
    ],
    primaryRole: 'Professor',
    primaryDepartment: 'Khoury',
  });
});

beforeEach(() => {
  expected = {
    12345: {
      employee: {
        id: '12345',
        name: 'Ben Lerner',
        firstName: 'Ben',
        lastName: 'Lerner',
        phone: '123-456-7890',
        emails: [
          'ben.lerner@northeastern.edu',
          'blerner@ccs.neu.edu',
        ],
        primaryRole: 'Professor',
        primaryDepartment: 'Khoury',
        url: 'https://blerner.com',
        personalSite: 'https://blernersite.com',
      },
      type: 'employee',
    },
    67890: {
      employee: {
        id: '67890',
        name: 'Matthias Felleisen',
        firstName: 'Matthias',
        lastName: 'Felleisen',
        phone: '098-765-4321',
        emails: [
          'mattias@ccs.neu.edu',
        ],
        primaryRole: 'Professor',
        primaryDepartment: 'Khoury',
      },
      type: 'employee',
    },
  };
});

afterAll(async () => {
  await sequelize.close();
});

describe('toJSON', () => {
  it('generates the proper object', async () => {
    const prof = await Professor.findByPk('12345');
    expect(prof.toJSON()).toEqual({
      id: '12345',
      name: 'Ben Lerner',
      firstName: 'Ben',
      lastName: 'Lerner',
      phone: '123-456-7890',
      emails: [
        'ben.lerner@northeastern.edu',
        'blerner@ccs.neu.edu',
      ],
      primaryRole: 'Professor',
      primaryDepartment: 'Khoury',
      url: 'https://blerner.com',
      personalSite: 'https://blernersite.com',
    });
  });
});

describe('bulkUpsertES', () => {
  it('upserts to ES', async () => {
    const firstProf = await Professor.findByPk('12345');
    const secondProf = await Professor.findByPk('67890');
    await Professor.bulkUpsertES([firstProf, secondProf]);

    expect(elastic.bulkIndexFromMap).toHaveBeenCalledWith(elastic.EMPLOYEE_INDEX, expected);
  });
});

describe('bulkCreate', () => {
  it('upserts to ES', async () => {
    expected['12345'].employee.firstName = 'Matthias';
    expected['67890'].employee.firstName = 'Ben';

    await Professor.bulkCreate([{ firstName: 'Matthias', id: '12345' }, { firstName: 'Ben', id: '67890' }], { updateOnDuplicate: ['firstName'] });

    expect(elastic.bulkIndexFromMap).toHaveBeenCalledWith(elastic.EMPLOYEE_INDEX, expected);
  });
});

describe('bulkUpdate', () => {
  it('upserts to ES', async () => {
    expected['12345'].employee.lastName = 'Gold';
    expected['67890'].employee.lastName = 'Gold';

    await Professor.update({ lastName: 'Gold' }, { where: { id: { [Op.in]: ['12345', '67890'] } } });

    expect(elastic.bulkIndexFromMap).toHaveBeenCalledWith(elastic.EMPLOYEE_INDEX, expected);
  });
});
