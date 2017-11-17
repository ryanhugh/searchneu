/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import _ from 'lodash';

import macros from '../../../macros';
import Section from '../../../../common/classModels/Section';

// Dumps the data in the semester.ly schema

// This is also duplicated schools/neu/config.json in semesterly. If this is updated update it there too.
const semesterlyCourseCodeRegex = /[A-Z]{0,4} [0-9]{4}/;

class Semesterly {
  main(dump) {
    const result = [];
    let meetings = [];

    const subjectMap = {};
    for (const subject of dump.subjects) {
      subjectMap[subject.subject] = subject.text;
    }


    const classMap = {};
    for (const aClass of dump.classes) {
      classMap[aClass.classUid] = aClass;
    }

    for (const aClass of dump.classes) {
      if (aClass.host !== 'neu.edu') {
        continue;
      }

      // Skip all the other terms for now too
      if (aClass.termId !== '201830') {
        continue;
      }

      const code = `${aClass.subject} ${aClass.classId}`;

      if (!code.match(semesterlyCourseCodeRegex)) {
        macros.error("Regex didn't match!", code, semesterlyCourseCodeRegex);
      }

      result.push({
        kind: 'course',
        code: code,
        credits: aClass.maxCredits,
        department: {
          code: aClass.subject,
          name: subjectMap[aClass.subject],
        },
        name: aClass.name,
        prerequisites: [''], // todo
        description: aClass.desc, // todo: add corequisites to the end of this
        school: {
          code: 'neu',
        },
      });
    }


    for (const section of dump.sections) {
      // Skip all the neu.edu/law and neu.edu/cps for now
      if (section.host !== 'neu.edu') {
        continue;
      }

      // Skip all the other terms for now too
      if (section.termId !== '201830') {
        continue;
      }

      const instance = Section.create(section);

      let professors = instance.getProfs();
      const code = `${section.subject} ${section.classId}`;

      // Semester.ly groups meetings by the start and end time of the meeting on each day of the week
      // so we need to get a list of all the meetings for each section and then re-group them
      // by start/end time
      // The key for this is just start+end (eg. "08:0010:00" (army time))
      const meetingsByStartEndTime = {};

      const dayCodes = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];

      if (instance.meetings) {
        for (const meeting of instance.meetings) {
          // TODO make this work
          if (meeting.getIsExam()) {
            continue;
          }

          const times = _.flatten(meeting.times);

          for (const time of times) {
            const start = time.start.format('HH:mm');
            const end = time.end.format('HH:mm');
            const dayOfWeek = parseInt(time.start.format('d'), 10);

            // Small sanity check
            if (dayOfWeek !== parseInt(time.end.format('d'), 10)) {
              macros.error('Meeting ends on a different day than it starts?', instance.termId, instance.classUid, instance.subject);
            }

            const key = start + end;
            if (!meetingsByStartEndTime[key]) {
              meetingsByStartEndTime[key] = {
                kind: 'meeting',
                course: {
                  code: code,
                },
                days: [],
                location: {
                  where: meeting.where,
                },
                section: {
                  code: section.crn,
                  term: 'Spring',
                  year: '2018',
                },
                time: {
                  start: start,
                  end: end,
                },
              };
            }

            meetingsByStartEndTime[key].days.push(dayCodes[dayOfWeek]);
            meetingsByStartEndTime[key].days = _.uniq(meetingsByStartEndTime[key].days);
          }
        }
      }

      // Add all the meetings
      meetings = meetings.concat(Object.values(meetingsByStartEndTime));

      professors = professors.map((name) => {
        return {
          name: name,
        };
      });

      result.push({
        capacity: section.seatsCapacity,
        code: section.crn,
        course: {
          code: code,
        },
        enrollment: section.seatsCapacity - section.seatsRemaining,
        instructors: professors,
        year: '2018',
        kind: 'section',
        term: 'Spring',
      });
    }


    const retVal = {
      $data: result.concat(meetings),
      $meta: {
        $schools: {
          neu: {
            2017: [
              '201730',
              '201740',
              '201750',
              '201760',
              '201810',
            ],
            2018: [
              '201830',
            ],
          },
        },
        $timestamp: Date.now() / 1000,
      },
    };


    return retVal;
  }
}


const instance = new Semesterly();

export default instance;
