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
