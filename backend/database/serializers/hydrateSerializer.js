import HydrateCourseSerializer from './hydrateCourseSerializer';
import HydrateProfSerializer from './hydrateProfSerializer';
import { Professor, Course } from '../models/index';

/* eslint-disable no-underscore-dangle */
class HydrateSerializer {
  constructor(sectionModel) {
    this.courseSerializer = new HydrateCourseSerializer(sectionModel);
    this.profSerializer = new HydrateProfSerializer();
  }

  async bulkSerialize(instances) {
    const profs = instances.filter((instance) => instance._source.type === 'employee');
    const courses = instances.filter((instance) => instance._source.type === 'course');

    const profInstances = await Professor.findAll({ where: { id: profs.map((prof) => { return prof._id }) } });
    const courseInstances = await Course.findAll({ where: { id: courses.map((course) => { return course._id }) } });

    const serializedProfs = await this.profSerializer.bulkSerialize(profInstances);
    const serializedCourses = await this.courseSerializer.bulkSerialize(courseInstances);

    return serializedProfs.concat(serializedCourses);
  }
}

export default HydrateSerializer;
