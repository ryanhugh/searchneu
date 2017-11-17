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
  classMap = {};

  go(termDump) {
    this.termDump = termDump;

    for (const aClass of termDump.classes) {
      const key = Keys.create(aClass).getHash();
      this.classMap[key] = aClass;
    }

    for (let aClass of this.termDump.classes) {
      if (aClass.prereqs) {
        aClass = this.parsePreReqs(aClass, aClass.prereqs);
      }
    }
  }

  // Recursively traverse the prerequsite structure
  parsePreReqs(mainClass, node, isRequired) {
    if (node && node.missing) {
      return;
    }
    if (this.isClass(node)) {
      const find = Keys.create({
        host: mainClass.host,
        termId: mainClass.termId,
        subject: node.subject,
        classUid: node.classUid,
      }).getHash();

      const nodeRef = this.classMap[find];

      if (nodeRef.optPrereqsFor === undefined) {
        nodeRef.optPrereqsFor = [];
      }

      debugger

      nodeRef.optPrereqsFor.push({
        subject: mainClass.subject,
        classUid: mainClass.classUid,
        classId: mainClass.classId,
      });

      debugger
    } else {
      const classType = node.type;

      if (node.values !== undefined) {
        node.values.map((course) => {
          // returns if the
          const reqType = (classType === 'and') ? isRequired : false;
          return this.parsePreReqs(mainClass, course, reqType);
        });
      }
    }
  }

  // Prerequisite -> Boolean
  // Checks if a prerequisite is a class or not
  isClass(prereq) {
    return Object.prototype.hasOwnProperty.call(prereq, 'subject');
  }
}

export default new AddPreRequisiteFor();
