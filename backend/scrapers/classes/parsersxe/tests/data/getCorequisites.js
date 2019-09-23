export default {
  biol3405: {
    request: {
      url: 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/getCorequisites',
      body: 'term=202010&courseReferenceNumber=17998',
    },
    body: '\n\n    No corequisite course information available.\n\n'
  },
  phys1161: {
    request: {
      url: 'https://nubanner.neu.edu/StudentRegistrationSsb/ssb/searchResults/getCorequisites',
      body: 'term=202010&courseReferenceNumber=10306',
    },
    body: '    \n\n\n' +
    '        <table class="basePreqTable">\n' +
    '            <thead>\n' +
    '            <tr>\n' +
    '                <th>Subject</th>\n' +
    '                <th>Course Number</th>\n' +
    '                <th>Title</th>\n' +
    '            </tr>\n' +
    '            </thead>\n' +
    '            <tbody>\n' +
    '            \n' +
    '                <tr>\n' +
    '                    <td>Physics</td>\n' +
    '                    <td>1162</td>\n' +
    '                    <td>Lab for PHYS 1161</td>\n' +
    '                </tr>\n' +
    '            \n' +
    '                <tr>\n' +
    '                    <td>Physics</td>\n' +
    '                    <td>1163</td>\n' +
    '                    <td>Recitation for PHYS 1161</td>\n' +
    '                </tr>\n' +
    '            \n' +
    '            </tbody>\n' +
    '        </table>\n' +
    '    \n',
  },
  hlth1201: {
    request: {
      url: '',
      body: '',
    },
    body: '\n\n    \n        \n' +
      '<table>\n' +
      '    <thead>\n' +
      '        <tr>\n' +
      '            <th>CRN</th>\n' +
      '            <th>Subject</th>\n' +
      '            <th>Course Number</th>\n' +
      '            <th>Title</th>\n' +
      '            <th>Section</th>\n' +
      '        </tr>\n' +
      '    </thead>\n' +
      '    <tbody>\n' +
      '        \n' +
      '            <tr>\n' +
      '                <td>11938</td>\n' +
      '                <td>Health Sci - Interdisciplinary</td>\n' +
      '                <td>1200</td>\n' +
      '                <td>Basic Skills for the Healthcare Professional</td>\n' +
      '                <td>01</td>\n' +
      '            </tr>\n' +
      '        \n' +
      '    </tbody>\n' +
      '</table>\n\n\n'
  }
}
