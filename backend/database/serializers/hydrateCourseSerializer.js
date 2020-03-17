import _ from 'lodash';
import CourseSerializer from './courseSerializer';
import { Course, Section } from '../models/index';

class HydrateCourseSerializer extends CourseSerializer {
  courseProps() {
    return ['lastUpdateTime', 'termId', 'host', 'subject', 'classId'];
  }

  courseCols() {
    return Object.keys(_.omit(Course.rawAttributes, ['id', 'createdAt', 'updatedAt']));
  }

  sectionCols() {
    return Object.keys(_.omit(Section.rawAttributes, ['id', 'createdAt', 'updatedAt', 'classHash']));
  }
}

export default HydrateCourseSerializer;
