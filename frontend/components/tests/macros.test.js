/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import macros from '../macros';

it('should run without crashing', () => {
  // This should not print anything to the console.
  macros.log('Test.');

  // This shoudn't send anything to amplitude.
  macros.logAmplitudeEvent('test', {});
});
