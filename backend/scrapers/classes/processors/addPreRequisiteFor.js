/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import BaseProcessor from './baseProcessor';
import Keys from '../../../../common/Keys';
import macros from '../../../macros';

/**
 * Adds the prerequsite-for field for classes that are a predecessor for
 * other classes.
 */
class AddPreRequisiteFor extends BaseProcessor.BaseProcessor {
  classMap = {};

  /**
   * Creates a class hash map based on the term dump, then calls parse every
   * request to link data.
   *
   * @param {Term Dump} termDump the termDump of the semester.
   */
  go(termDump) {
    for (const aClass of termDump.classes) {
      const key = Keys.getClassHash(aClass);

      // Reset all the prereqsFor arrays at the beginning of each time this is ran over a termDump.
      this.initializeArray(aClass);

      this.classMap[key] = aClass;
    }

    for (const aClass of termDump.classes) {
      if (aClass.prereqs) {
        this.parsePreReqs(aClass, aClass.prereqs, true);
      }
    }

    for (const aClass of termDump.classes) {
      this.sortPreReqs(aClass);
    }
  }

  /* A Prerequisite is one of:
   * - String
   * - Class
   * - [Prerequsite]
   */

  /**
   * Recursively traverse the prerequsite structure.
   *
   * @param {Class Object} mainClass - the class that we're checking the
   * prereqs for. If it has a prereq, we add this class to the prereq's
   * optPrereqFor field.
   * @param {Prerequisite} node - a prerequsite class of mainClass. This is
   * the field where we add the mainClass information to.
   * @param {Boolean} isRequired - whether or not the prerequisite is required.
   */
  parsePreReqs(mainClass, node, isRequired) {
    if (node && node.missing) {
      return;
    }

    // Get the the class we wish to refere to
    if (this.isClass(node)) {
      const find = Keys.getClassHash({
        host: mainClass.host,
        termId: mainClass.termId,
        subject: node.subject,
        classId: node.classId,
      });

      const nodeRef = this.classMap[find];

      if (!nodeRef) {
        macros.error('Unable to find ref for', find, node, mainClass);
        return;
      }

      const classData = {
        subject: mainClass.subject,
        classId: mainClass.classId,
      };

      if (isRequired) {
        nodeRef.prereqsFor.values.unshift(classData);
      } else {
        nodeRef.optPrereqsFor.values.unshift(classData);
      }
    } else {
      const classType = node.type;

      if (node.values !== undefined) {
        node.values.map((course) => {
          // A required course becomes effectively optional when we encounter
          // an 'or' in our tree.
          const reqType = (classType === 'and') ? isRequired : false;
          return this.parsePreReqs(mainClass, course, reqType);
        });
      }
    }
  }

  /**
   * Creates the fields 'optPrereqsFor' and 'prereqsFor' in nodeRef.
   *
   * @param {Class} nodeRef the class in our tree that we're creating the
   * arrays for.
   */
  initializeArray(nodeRef) {
    // Creates the optPrereqsFor field in our class.
    nodeRef.optPrereqsFor = {
      values: [],
    };

    nodeRef.prereqsFor = {
      values: [],
    };
  }

  // Sorts the prereqs for in alphabetical order.
  // except that the classes with the same subject as the main classe's subject.
  // If two classes have the same subject, they are sorted by classId
  sortPrereqsValues(matchingSubject, values) {
    return values.sort((a, b) => {
      if (a.subject !== b.subject) {
        if (a.subject === matchingSubject) {
          return -1;
        }
        if (b.subject === matchingSubject) {
          return 1;
        }
        if (a.subject < b.subject) {
          return -1;
        }
        if (a.subject > b.subject) {
          return 1;
        }
      }

      const firstId = parseInt(a.classId, 10);
      const secondId = parseInt(b.classId, 10);

      if (firstId < secondId) {
        return -1;
      }
      if (firstId > secondId) {
        return 1;
      }

      return 0;
    });
  }

  /**
   * Recursively traverse the prerequsite structure.
   *
   * @param {Class} aClass - a class to sort the optPrereqsFor and prereqsFor of.
   */
  sortPreReqs(aClass) {
    if (aClass.optPrereqsFor && aClass.optPrereqsFor.values) {
      aClass.optPrereqsFor.values = this.sortPrereqsValues(aClass.subject, aClass.optPrereqsFor.values);
    }

    if (aClass.prereqsFor && aClass.prereqsFor.values) {
      aClass.prereqsFor.values = this.sortPrereqsValues(aClass.subject, aClass.prereqsFor.values);
    }
  }

  // Prerequisite -> Boolean
  // Checks if a prerequisite is a class or not
  isClass(prereq) {
    return Object.prototype.hasOwnProperty.call(prereq, 'subject');
  }
}

export default new AddPreRequisiteFor();
