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
  // Recursively traverse the prerequsite structure
  outputParsePreReqs(prereqs) {
    return `${prereqs.values.reduce((sum, aclass) => {
      if (!aclass.missing) {
        return `${sum} ${aclass.classUid}`;
      }
      return `${sum} 00000`;
    }, `(${prereqs.type}`)} )`;
  }

  // Recursively traverse the prerequsite structure
  parsePreReqs(prereqs) {
    return prereqs.values.map((obj) => {
      // If there's a type, then it's not a class but rather a structure obj.
      if (obj.type) {
        return this.parsePreReqs(obj);
      }

      // Deal with the class
      return this.parseClass(obj);
    });
  }

  parseClass(aclass) {
    return aclass.classUid;
  }
}

export default addPreRequisiteFor;
