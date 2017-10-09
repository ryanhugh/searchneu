/*
 * Copyright (c) 2017 Ryan Hughes
 *
 * This file is part of CoursePro.
 *
 * CoursePro is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * version 3 as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */


import _ from 'lodash';

import macros from '../../../macros';
import BaseProcessor from './baseProcessor';

// This file adds startDate and endDate to each term based on the start and end dates in sections in that term
// The start date is the first date that over 10% of sections start on, and the end is the last date that over 10% of sections end on
// If no one date has over 10% sections start on that date, it is just the first/last date

class TermStartEndDate extends BaseProcessor.BaseProcessor {


  runOnTerm(termDump, term) {
    const startDates = {};
    const endDates = {};
    let meetingCount = 0;

    if (termDump.sections.length === 0) {
      macros.error('No sections in db???', termDump.sections);
    }

    termDump.sections.forEach((section) => {
      if (section.termId !== term.termId) {
        return;
      }

      if (section.meetings) {
        section.meetings.forEach((meeting) => {
          if (startDates[meeting.startDate] === undefined) {
            startDates[meeting.startDate] = 0;
          }
          startDates[meeting.startDate]++;

          if (endDates[meeting.endDate] === undefined) {
            endDates[meeting.endDate] = 0;
          }
          endDates[meeting.endDate]++;
          meetingCount++;
        });
      }
    });

    let finalStartDate;
    let finalEndDate;

    const startDateKeys = _.keys(startDates).sort((a, b) => {
      return parseInt(a, 10) - parseInt(b, 10);
    });

    for (let i = 0; i < startDateKeys.length; i++) {
      const date = startDateKeys[i];
      if (startDates[date] > 0.1 * meetingCount) {
        finalStartDate = date;
        break;
      }
    }

    // Pick the first day if nothing was decisive.
    if (!finalStartDate) {
      macros.log('Warning, no start date was definitive', term.termId, startDates);
      finalStartDate = startDateKeys[0];
    }


    // Now for the end dates
    const endDateKeys = _.keys(endDates).sort((a, b) => {
    // sort in reverse order
      return parseInt(b, 10) - parseInt(a, 10);
    });

    for (let i = 0; i < endDateKeys.length; i++) {
      const date = endDateKeys[i];
      if (endDates[date] > 0.1 * meetingCount) {
        finalEndDate = date;
        break;
      }
    }

    // Pick the last day if nothing was decisive.
    // (the endDateKeys are in reverse chronological order)
    if (!finalEndDate) {
      macros.log('Warning, no end date was definitive', term.termId, endDates);
      finalEndDate = endDateKeys[0];
    }


    term.startDate = finalStartDate;
    term.endDate = finalEndDate;
    return term;
  }


  go(termDump) {
    for (const term of termDump.terms) {
      this.runOnTerm(termDump, term);
    }
    return termDump;
  }

}


TermStartEndDate.prototype.TermStartEndDate = TermStartEndDate;
export default new TermStartEndDate();

