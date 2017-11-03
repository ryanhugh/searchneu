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
import Keys from '../../../../common/Keys';

class AddPreRequisiteFor extends BaseProcessor.BaseProcessor {
  termDump = {}

  go(termDump) {
    this.termDump = termDump;
    for (const aClass of this.termDump.classes) {
      this.parsePreReqs(aClass, aClass.prereqs);
    }

    return termDump;
  }

  // Recursively traverse the prerequsite structure
  parsePreReqs(mainClass, prereqs, type) {
    if (Array.isArray(prereqs)) {
      return prereqs.values.map((obj) => {
        return this.parsePreReqs(mainClass, obj, prereqs.type);
      });
    }

    // Deal with the class
    return this.parseClass(mainClass, prereqs, type);
  }

  // Append mainClass to the prereqsFor array of prereqClass
  parseClass(mainClass, prereqClass, type) {
    const find = Keys.create(prereqClass).getHash();
    let found = {};
    for (const aClass of this.termDump.classes) {
      if (Keys.create(aClass).getHash() === find) {
        found = aClass;
        break;
      }
    }

    if (type === 'and') {
      if (found.prereqsFor === undefined) {
        found.prereqsFor = [];
      }
      found.prereqsFor.push(mainClass);
    } else {
      if (found.optPrereqsFor === undefined) {
        found.optPrereqsFor = [];
      }
      found.optPrereqsFor.push(mainClass);
    }
  }
}

export default new AddPreRequisiteFor();
