/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import _ from 'lodash';
import { Op } from 'sequelize';

class CourseSerializer {
  // this is a hack to get around the circular dependency created by [elasticSerializer -> courseSerializer -> database/index -> database/course -> elasticSerializer]
  constructor(sectionModel) {
    this.sectionModel = sectionModel;
  }

  async bulkSerialize(instances) {
    const courses = instances.map((course) => { return this.serializeCourse(course); });

    const sections = await this.sectionModel.findAll({
      where: {
        classHash: { [Op.in]: instances.map((instance) => instance.id) },
      },
    });

    const classToSections = _.groupBy(sections, 'classHash');

    return _(courses).keyBy(this.getClassHash).mapValues((course) => {
      return this.bulkSerializeCourse(course, classToSections[this.getClassHash(course)] || []);
    }).value();
  }

  bulkSerializeCourse(course, sections) {
    const serializedSections = this.serializeSections(sections, course);

    return {
      class: course,
      sections: serializedSections,
      type: 'class',
    };
  }

  serializeSections(sections, parentCourse) {
    if (sections.length === 0) return sections;
    return sections.map((section) => { return this.serializeSection(section); }).map((section) => {
      return { ...section, ..._.pick(parentCourse, this.courseProps()) };
    });
  }

  serializeCourse(course) {
    const obj = course.dataValues;
    obj.lastUpdateTime = obj.lastUpdateTime.getTime();

    return _(obj).pick(this.courseCols()).value();
  }

  serializeSection(section) {
    const obj = section.dataValues;
    return _(obj).pick(this.sectionCols()).value();
  }

  // TODO this should definitely be eliminated
  getClassHash(course) {
    return ['neu.edu', course.termId, course.subject, course.classId].join('/');
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
