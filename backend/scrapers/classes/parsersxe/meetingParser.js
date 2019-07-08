import moment from 'moment';
import macros from '../../../macros';


/**
 * @param facultyMeetingTimes the output from
 * https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-meeting-times-get
 */
function meetings(xeResponse) {
  if (Array.isArray(xeResponse.fmt))
    xeResponse = xeResponse.fmt;
  return xeResponse.map(m => {
    const meetingTime = m.meetingTime;
    return {
      startDate: mmddyyyyToDaysSinceEpoch(meetingTime.startDate),
      endDate: mmddyyyyToDaysSinceEpoch(meetingTime.endDate),
      profs: m.faculty.map(o => prof(o)),
      where: meetingTime.buildingDescription ? `${meetingTime.buildingDescription} ${meetingTime.room}` : 'TBA',
      type: meetingTime.meetingTypeDescription,
      times: days(meetingTime)
    };
  });
}


/**
 * "LastName, FirstName" --> "FirstName LastName"
 * @param xeData should be an element of the fmt.faculty array as returned from
 * https://jennydaman.gitlab.io/nubanned/dark.html#searchresults-meeting-times-get
 */
function prof(xeData) {
  if (xeData.displayName)
    xeData = xeData.displayName;
  if (typeof xeData !== 'string')
    macros.error('parameter should be a string');
  return xeData.split(',').map(s => s.trim()).reverse().join(' ');
}


// example "0915" -> 9 * 3600 + 15 * 60 = 33300
function hhmmToSeconds(hhmm) {
  if (!hhmm)
    return null; // time TBD
  else if (hhmm.length !== 4)
    macros.error(`Length of hhmm time string "${hhmm}" is not 4`);
  const hours = parseInt(hhmm.substring(0, 2));
  const minutes = parseInt(hhmm.substring(2));
  return hours * 3600 + minutes * 60;
}


function mmddyyyyToDaysSinceEpoch(mmddyyyy) {
  /*
   * should I worry about time zones here?
   * moment is in GMT, epoch is in UTC, apparently those are the same.
   *
   * 864,000 seconds per day
   * bitwise OR | 0 casts float to int
   */
  return moment(mmddyyyy, 'MM/DD/YYYY').unix() / 86400 | 0;
}


const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function days(meetingTime) {
  const times = {};
  const info = {
    start: hhmmToSeconds(meetingTime.beginTime),
    end: hhmmToSeconds(meetingTime.endTime)
  };

  for (let i = 0; i < DAYS.length; i++) {
    if (meetingTime[DAYS[i]])
      times[i.toString()] = info;
  }
  return times;
}

export default meetings;

// import htlh2200 from '../../../tests/dataxe/getFacultyMeetingTimes/htlh2200.json';
//
// macros.log(JSON.stringify(meetings(htlh2200)));
