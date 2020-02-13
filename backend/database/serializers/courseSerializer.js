import _ from 'lodash';
import { Op, Section } from '../models/index';

class CourseSerializer {
  async bulkSerialize(instances) {
    const courses = instances.map(this.serializeCourse);
    const sections = await Section.findAll({
      where: {
        classHash: { [Op.in]: courses.map('id') },
      },
    });

    const classToSections = _.groupBy(sections, 'classHash');

    return _(instances).keyBy('classHash').mapValues((instance) => {
      return this.bulkSerializeCourse(instance, classToSections[instance.id]);
    }).value();
  }

  bulkSerializeCourse(course, sections) {
    const serializedSections = this.serializeSections(sections);
    course.crns = serializedSections.map('crn');
    course.sections = serializedSections;

    return {
      class: course,
      sections: serializedSections,
      type: 'class',
    };
  }

  serializeSections(sections, parentCourse) {
    sections.map(this.serializeSection).map((section) => {
      return { ...section, ..._.pick(parentCourse, this.courseProps()) };
    });
  }

  serializeCourse(course) {
    const obj = course.dataValues;
    obj.lastUpdateTime = obj.lastUpdateTime.getTime();

    return _(obj).pick(this.courseCols()).omitBy(_.isNil).value();
  }

  serializeSection(section) {
    const obj = section.dataValues;
    return _(obj).pick(this.sectionCols()).omitBy(_.isNil).value();
  }

  courseCols() {
    throw new Error('not implemented');
  }

  courseProps() {
    throw new Error('not implemented');
  }

  sectionCols() {
    throw new Error('not implemented');
  }
}

export default CourseSerializer;
