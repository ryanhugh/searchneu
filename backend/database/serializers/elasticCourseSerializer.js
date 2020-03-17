import CourseSerializer from './courseSerializer';

class ElasticCourseSerializer extends CourseSerializer {
  courseProps() {
    return [];
  }

  courseCols() {
    return ['host', 'name', 'subject', 'classId', 'termId'];
  }

  sectionCols() {
    return ['profs'];
  }
}

export default ElasticCourseSerializer;
