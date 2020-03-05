import CourseSerializer from './courseSerializer';

class ElasticSerializer extends CourseSerializer {
  courseProps() {
    return [];
  }

  courseCols() {
    return ['name', 'subject', 'classId', 'termId'];
  }

  sectionCols() {
    return ['profs'];
  }
}

export default ElasticSerializer;
