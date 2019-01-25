/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

// import path from 'path';
import moment from 'moment';
// import ics from 'ics';
import macros from './macros';

// This file is not currently used in production.
// run yarn add ics when this file is used again
// I started working on a calendar feature that used this file in a different branch, but deleted the branch and saving the file here.


// hash -> ical file
class Calendar {
  constructor(dataLib) {
    this.dataLib = dataLib;
  }

  static create(dataLib) {
    if (!dataLib) {
      macros.error('Invalid dataLib', dataLib);
      return null;
    }

    return new this(dataLib);
  }


  get(hash) {
    const section = this.dataLib.getSectionServerDataFromHash(hash);

    if (!section) {
      macros.warn('Invalid section requested for calendar', hash);
      return '';
    }

    macros.log(JSON.stringify(section));

    // https://icalendar.org/validator.html
    // https://github.com/adamgibbons/ics/issues/30

    // {
    //   "classId": "1100",
    //   "crn": "11293",
    //   "honors": false,
    //   "host": "neu.edu",
    //   "lastUpdateTime": 1524809355823,
    //   "meetings": [
    //     {
    //       "allProfs": [
    //         "Ghita Amor-Tijani"
    //       ],
    //       "endDate": 17870,
    //       "profs": [
    //         "Ghita Amor-Tijani"
    //       ],
    //       "startDate": 17779,
    //       "times": {
    //         "1": [
    //           {
    //             "end": 41700,
    //             "start": 37800
    //           }
    //         ]
    //       },
    //       "type": "Class",
    //       "where": "West Village H 212"
    //     }
    //   ],
    //   "online": false,
    //   "seatsCapacity": 19,
    //   "seatsRemaining": 0,
    //   "subject": "CS",
    //   "termId": "201910",
    //   "url": "https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201910&crn_in=11293",
    //   "waitCapacity": 0,
    //   "waitRemaining": 0
    // }


    const events = [];

    const serverData = {}; // todo: fix


    for (const meeting of section.meetings) {
      const startDate = moment((serverData.startDate + 1) * 24 * 60 * 60 * 1000);
      const endDate = moment((serverData.endDate + 1) * 24 * 60 * 60 * 1000);


      const eventObj = {
        start: [2018, 5, 30, 6, 30],
        duration: { hours: 6, minutes: 30 },
        title: `${section.subject} ${section.classId}`,
        description: `${section.subject} ${section.classId}`,
        location: meeting.where,
        url: 'http://www.bolderboulder.com/',
        geo: { lat: 40.0095, lon: 105.2669 },
        categories: ['10k races', 'Memorial Day Weekend', 'Boulder CO'],
        status: 'CONFIRMED',
        organizer: { name: 'Admin', email: 'Race@BolderBOULDER.com' },
        attendees: [
          { name: 'Adam Gibbons', email: 'adam@example.com', rsvp: true },
          { name: 'Brittany Seaton', email: 'brittany@example2.org' },
        ],
      };

      macros.log(startDate);
      macros.log(eventObj);
      macros.log(endDate);
    }

    macros.log(events);


    return '';
  }
}

export default Calendar;
