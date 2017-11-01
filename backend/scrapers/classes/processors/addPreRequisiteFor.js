/*
 * Copyright (c) 2017 Edward Shen
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import BaseProcessor from './baseProcessor';

class addPreRequisiteFor extends BaseProcessor.BaseProcessor {
  go(termDump) {
    for (const aClass of termDump.classes) {
      this.parsePreReqs(aClass.prereqs);
    }

    return termDump;
  }

  // Prerequisite -> null
  // Parses the Prerequisite and calls the respective function to deal with
  // each one
  parsePreReqs(prereqs) {
    if (prereqs.type === 'and') {
      this.parseAndPreReqs(prereqs.values);
    } else {
      this.parseOrPreReqs(prereqs.values);
    }
  }

  // Prerequisite -> null
  // Parses a prerequisite that
  parseAndPreReqs(prereq) {
    if (Array.isArray(prereq)) {
      prereq.forEach((req) => { this.parsePreReqs(req); });
    } else {

    }
  }

  parseOrPreReqs(prereq) {
    if (Array.isArray) {
      prereq.forEach((req) => { this.parsePreReqs(req); });
    } else {

    }
  }
}

export default addPreRequisiteFor;
