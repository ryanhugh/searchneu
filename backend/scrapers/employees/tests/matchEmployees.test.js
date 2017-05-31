import matchEmployees from '../matchEmployees';


it('analytics should work', () => {
  matchEmployees.resetAnalytics();
  matchEmployees.logAnalyticsEvent('hi');
  expect(matchEmployees.analytics.hi).toBe(1);
  matchEmployees.resetAnalytics();
  expect(matchEmployees.analytics.hi).toBe(undefined);
});
