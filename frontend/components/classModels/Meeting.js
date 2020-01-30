/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import _ from 'lodash';
import moment from 'moment';

import macros from '../macros';

class Meeting {
  constructor(serverData) {
    if (!serverData) {
      return null;
    }

    this.where = serverData.where;

    // if without spaces and case insensitive is tba, make it TBA
    if (this.where.replace(/\s/gi, '').toUpperCase() === 'TBA') {
      this.where = 'TBA';
    }

    //beginning of the day that the class starts/ends
    this.startDate = moment((serverData.startDate + 1) * 24 * 60 * 60 * 1000);
    this.endDate = moment((serverData.endDate + 1) * 24 * 60 * 60 * 1000);

    //grouped by start+end time on each day.
    // eg, if have class that meets tue, wed, thu, at same time each day,
    // each list must be at least 1 long
    // you would have [[{start:end:},{start:end:},{start:end:}]]
    // where each start:end: object is a different day
    this.times = [];

    const timeMoments = [];

    if (serverData.times) {
      const dayIndexies = Object.keys(serverData.times);

      for (const dayIndex of dayIndexies) {
        serverData.times[dayIndex].forEach((event) => {
          //3 is to set in the second week of 1970
          const day = parseInt(dayIndex, 10) + 3;

          const obj = {
            start: moment.utc(event.start * 1000).add(day, 'day'),
            end: moment.utc(event.end * 1000).add(day, 'day'),
          };

          if (parseInt(obj.start.format('YYYY'), 10) !== 1970) {
            macros.error();
          }

          timeMoments.push(obj);
        });
      }
    }


    // returns objects like this: {3540000041400000: Array[3]}
    // if has three meetings per week that meet at the same times
    let groupedByTimeOfDay = _.groupBy(timeMoments, (event) => {
      const zero = moment(event.start).startOf('day');
      return `${event.start.diff(zero)}${event.end.diff(zero)}`;
    });

    // Get the values of the object returned above
    groupedByTimeOfDay = _.values(groupedByTimeOfDay);

    // And sort by start time
    groupedByTimeOfDay.sort((meetingsInAday) => {
      const zero = moment(meetingsInAday[0].start).startOf('day');
      return meetingsInAday[0].start.diff(zero);
    });

    this.times = groupedByTimeOfDay;
  }

  getBuilding() {
    // regex off the room number
    return this.where.replace(/\d+\s*$/i, '').trim();
  }

  getHoursPerWeek() {
    let retVal = 0;

    _.flatten(this.times).forEach((time) => {
      // moment#diff returns ms, need hr
      retVal += time.end.diff(time.start) / (1000 * 60 * 60);
    });

    return Math.round(10 * retVal) / 10;
  }

  // returns sorted list of weekday strings, eg
  //["Monday","Friday"]
  getWeekdayStrings() {
    const retVal = [];

    const flatTimes = _.flatten(this.times);

    flatTimes.sort((a, b) => {
      if (a.start.unix() < b.start.unix()) {
        return -1;
      }
      if (a.start.unix() > b.start.unix()) {
        return 1;
      }

      return 0;
    });

    flatTimes.forEach((time) => {
      const weekdayString = time.start.format('dddd');
      if (!retVal.includes(weekdayString)) {
        retVal.push(weekdayString);
      }
    });

    return retVal;
  }

  getIsHidden() {
    return this.getHoursPerWeek() === 0;
  }

  getIsExam() {
    // this could be improved by scraping more data...
    return this.startDate.unix() === this.endDate.unix();
  }

  // 0=sunday, 6 = saterday
  getMeetsOnDay(dayIndex) {
    const flatTimes = _.flatten(this.times);
    return flatTimes.some((time) => { return time.start.day() === dayIndex; });
  }


  getMeetsOnWeekends() {
    if (this.getIsExam()) {
      return false;
    }

    if (this.getMeetsOnDay(0) || this.getMeetsOnDay(6)) {
      return true;
    }

    return false;
  }


  // no idea if this is right
  compareTo(other) {
    if (this.times.length === 0) {
      return 1;
    }
    if (other.times.length === 0) {
      return -1;
    }
    if (this.times[0][0].start.unix() > other.times[0][0].start.unix()) {
      return 1;
    }
    if (this.times[0][0].start.unix() < other.times[0][0].start.unix()) {
      return -1;
    }

    return 0;
  }
}


export default Meeting;
