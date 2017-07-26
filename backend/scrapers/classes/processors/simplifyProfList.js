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

import BaseProcessor from './baseProcessor';


class SimplifyProfList extends BaseProcessor.BaseProcessor {


  go(termDump) {
    const updatedSections = [];

    const sectionGrouped = this.groupSectionsByClass(termDump.sections);
    sectionGrouped.forEach((sectionGroup) => {
      const profCount = {};

      // Populate prof count. Counts if prof is present in any meetings in a section
      sectionGroup.forEach((section) => {
        if (!section.meetings) {
          return;
        }

        const thisSectionProfs = [];


        section.meetings.forEach((meeting) => {
          if (!meeting.profs) {
            return;
          }

          // Keep a reference to the full list of professors
          if (!meeting.allProfs) {
            meeting.allProfs = meeting.profs.slice(0);
          }

          meeting.profs.forEach((prof) => {
            if (!thisSectionProfs.includes(prof)) {
              thisSectionProfs.push(prof);
            }
          });
        });


        thisSectionProfs.forEach((prof) => {
          if (!profCount[prof]) {
            profCount[prof] = 0;
          }
          profCount[prof]++;
        });
      });

      if (sectionGroup.length === 1) {
        return;
      }

      const profsOnEverySection = [];

      // Find the profs that are listed on every section
      for (const prof in profCount) {
        if (profCount[prof] === sectionGroup.length) {
          profsOnEverySection.push(prof);
        }
      }


      // Remove any prof in prof count that is present in all sectionGroup and when there are other profs also listed on the same section
      sectionGroup.forEach((section) => {
        let count = 0;

        if (!section.meetings) {
          return;
        }

        section.meetings.forEach((meeting) => {
          // If all the professors in this meeting are on every meeting, don't remove any of them.
          if (meeting.profs.length === profsOnEverySection.length) {
            return;
          }

          profsOnEverySection.forEach((prof) => {
            if (meeting.profs.length > 1) {
              count++;
              _.pull(meeting.profs, prof);
            }
          });
        });

        if (count > 0) {
          updatedSections.push(section);
          console.log('Removing ', count, 'profs from ', section.classUid, section.crn);
        }
      });
    });

    return termDump;
  }
}

export default new SimplifyProfList();

