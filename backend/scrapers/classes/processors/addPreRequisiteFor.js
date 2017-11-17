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
    for (let aClass of this.termDump.classes) {
      console.log(`prereqfor: ${aClass}`);
      console.log(`prereqfor: ${aClass.prereqs}`);
      if (aClass.prereqs) {
        aClass = this.parsePreReqs(aClass, aClass.prereqs);
      }
    }

    for (const aClass of termDump.classes) {
      const key = Keys.create(aClass).getHash();
      this.classMap[key] = aClass;
    }

    return termDump;
  }

  // Recursively traverse the prerequsite structure
  parsePreReqs(mainClass, node, isRequired) {

    if (this.isClass(node)) {
      const find = Keys.create({
        host: mainClass.host,
        termId: mainClass.termId,
        subject: node.subject,
        classUid: node.classUid,
      }).getHash();

      const nodeRef = this.termDump[find];

      if (nodeRef.prereqsFor === undefined) {
        nodeRef.optPrereqsFor = [];
      } else {
        nodeRef.optPrereqsFor.push({
          subject: mainClass.subject,
          classId: mainClass.classId,
        });
      }
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
    if (!prereq) {
      debugger
    }
    Object.prototype.hasOwnProperty.call(prereq, 'subject');
  }

  // Append mainClass to the prereqsFor array of prereqClass
  parseClass(mainClass, prereqClass, type) {
    const find = Keys.create({
      host: mainClass.host,
      termId: mainClass.termId,
      subject: prereqClass.subject,
      classUid: prereqClass.classUid,
    }).getHash();

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
