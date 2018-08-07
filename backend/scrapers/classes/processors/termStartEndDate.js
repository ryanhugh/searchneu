/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import _ from 'lodash';

import macros from '../../../macros';
import BaseProcessor from './baseProcessor';

// This file adds startDate and endDate to each term based on the start and end dates in sections in that term
// The start date is the first date that over 10% of sections start on, and the end is the last date that over 10% of sections end on
// If no one date has over 10% sections start on that date, it is just the first/last date

class TermStartEndDate extends BaseProcessor.BaseProcessor {
  runOnTerm(termDump, term) {
    // Don't run on this term if this term already has a startDate and endDate.
    if (term.startDate && term.endDated) {
      return term;
    }

    const startDates = {};
    const endDates = {};
    let meetingCount = 0;

    if (!termDump.sections || termDump.sections.length === 0) {
      macros.error('No sections in db???', termDump.sections, Object.keys(termDump));
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
    // If this term dump is just updating a few classes as part of the updater.js
    // There will be no terms
    // In this case just return.
    if (!termDump.terms) {
      return termDump;
    }


    for (const term of termDump.terms) {
      this.runOnTerm(termDump, term);
    }
    return termDump;
  }
}


TermStartEndDate.prototype.TermStartEndDate = TermStartEndDate;
export default new TermStartEndDate();
