/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import matchEmployees from '../matchEmployees';

it('analytics should work', () => {
  matchEmployees.resetAnalytics();
  matchEmployees.logAnalyticsEvent('hi');
  expect(matchEmployees.analytics.hi).toBe(1);
  matchEmployees.resetAnalytics();
  expect(matchEmployees.analytics.hi).toBe(undefined);
});


it('should check okToMatch', () => {
  const goodMatchObj = {
    matches: [
      {
        name: 'Jan Belmonte',
        firstName: 'Jan',
        lastName: 'Belmonte',
        id: '3JbDnIPRgqWTpBdVfw20kQ%3D%3D',
        phone: '6173735204',
        emails: [],
        primaryRole: 'Executive Assistant',
        primaryDepartment: 'Khoury',
      },
    ],
    emails: ['j.belmonte@northeastern.edu'],
    firstName: 'Jan',
    lastName: 'Belmonte',
    peopleListIndexMatches: { 0: true },
  };


  const badMatchObj = {
    matches: [
      {
        name: 'Jan Belmonte',
        firstName: 'Jan',
        lastName: 'Belmonte',
        id: '3JbDnIPRgqWTpBdVfw20kQ%3D%3D',
        phone: '6173735204',
        emails: [],
        primaryRole: 'Executive Assistant',
        primaryDepartment: 'Khoury',
      },
    ],
    emails: ['j.belmontetttt@northeastern.edu'],
    firstName: 'Jan',
    lastName: 'Belmonte',
    peopleListIndexMatches: { 0: true },
  };


  const alsoGoodMatch = {
    matches: [
      {
        name: 'Jan Belmonte',
        firstName: 'Jan',
        lastName: 'Belmonte',
        id: '3JbDnIPRgqWTpBdVfw20kQ%3D%3D',
        phone: '6173735204',
        emails: [],
        primaryRole: 'Executive Assistant',
        primaryDepartment: 'Khoury',
      },
    ],
    emails: ['j.belmonte@waaaaaaa.edu'],
    firstName: 'Jan',
    lastName: 'Belmonte',
    peopleListIndexMatches: { 0: true },
  };


  const person = {
    name: 'Jan Belmonte',
    firstName: 'Jan',
    lastName: 'Belmonte',
    url: 'https://www.khoury.northeastern.edu/people/jan-belmonte/',
    primaryRole: 'Executive Assistant',
    emails: ['j.belmonte@northeastern.edu'],
    officeRoom: '202 West Village H',
    officeStreetAddress: '440 Huntington Avenue',
    bigPictureUrl: 'https://www.khoury.northeastern.edu/wp-content/uploads/2016/12/linderpix-NEU-52098-hero-image.jpg',
  };

  const peopleListIndex = 1;

  expect(matchEmployees.okToMatch(goodMatchObj, person, peopleListIndex)).toBe(true);
  expect(matchEmployees.okToMatch(alsoGoodMatch, person, peopleListIndex)).toBe(true);
  expect(matchEmployees.okToMatch(badMatchObj, person, peopleListIndex)).toBe(false);
});


it('should not match from the saem list', () => {
  const match = {
    matches: [
      {
        name: 'Jan Belmonte',
        firstName: 'Jan',
        lastName: 'Belmonte',
        id: '3JbDnIPRgqWTpBdVfw20kQ%3D%3D',
        phone: '6173735204',
        emails: [],
        primaryRole: 'Executive Assistant',
        primaryDepartment: 'Khoury',
      },
    ],
    emails: ['j.belmonte@waaaaaaa.edu'],
    firstName: 'Jan',
    lastName: 'Belmonte',
    peopleListIndexMatches: { 0: true },
  };


  const person = {
    name: 'Jan Belmonte',
    firstName: 'Jan',
    lastName: 'Belmonte',
    url: 'https://www.khoury.northeastern.edu/people/jan-belmonte/',
    primaryRole: 'Executive Assistant',
    officeRoom: '202 West Village H',
    officeStreetAddress: '440 Huntington Avenue',
    bigPictureUrl: 'https://www.khoury.northeastern.edu/wp-content/uploads/2016/12/linderpix-NEU-52098-hero-image.jpg',
  };

  expect(matchEmployees.okToMatch(match, person, 0)).toBe(false);
  expect(matchEmployees.okToMatch(match, person, 1)).toBe(true);
});
