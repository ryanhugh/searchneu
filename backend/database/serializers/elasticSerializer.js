import CourseSerializer from './courseSerializer';

class ElasticSerializer extends CourseSerializer {
  courseProps() {
    return [];
  }

  courseCols() {
    return ['name', 'subject', 'classId', 'crns'];
  }

  sectionCols() {
    return ['profs'];
  }
}

const instance = new ElasticSerializer();
export default instance;
