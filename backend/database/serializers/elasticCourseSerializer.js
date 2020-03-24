/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import CourseSerializer from './courseSerializer';

class ElasticCourseSerializer extends CourseSerializer {
  courseProps() {
    return [];
  }

  courseCols() {
    return ['host', 'name', 'subject', 'classId', 'termId', 'nupath'];
  }

  sectionCols() {
    return ['profs', 'online', 'classType'];
  }
}

export default ElasticCourseSerializer;
