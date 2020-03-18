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
    const profs = instances.filter((instance) => { return instance._source.type === 'employee' });
    const courses = instances.filter((instance) => { return instance._source.type === 'class' });

    const profInstances = await Professor.findAll({ where: { id: profs.map((prof) => { return prof._id }) } });
    const courseInstances = await Course.findAll({ where: { id: courses.map((course) => { return course._id }) } });

    const serializedProfs = await this.profSerializer.bulkSerialize(profInstances);
    const serializedCourses = await this.courseSerializer.bulkSerialize(courseInstances);

    const serializedResults = { ...serializedProfs, ...serializedCourses };
    return instances.map((instance) => serializedResults[instance._id]);
  }
}

export default HydrateSerializer;
