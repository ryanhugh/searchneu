import HydrateCourseSerializer from './hydrateCourseSerializer';
import HydrateProfSerializer from './hydrateProfSerializer';
import { Professor, Course } from '../models/index';
import macros from '../../macros';

class HydrateSerializer {
  constructor(sectionModel) {
    this.courseSerializer = new HydrateCourseSerializer(sectionModel);
    this.profSerializer = new HydrateProfSerializer();
  }

  async bulkSerialize(instances) {
    const [profs, courses] = instances.reduce(([profs, courses], instance) => {
      macros.log(instance);
      if (instance._source.type === 'employee') {
        return [profs.concat([instance]), courses];
      } else {
        return [profs, courses.concat([instance])];
      }
    }, [[], []]);

    const profInstances = await Professor.findAll({ where: { id: profs.map((prof) => { return prof._id }) } });
    const courseInstances = await Course.findAll({ where: { id: courses.map((course) => { return course._id }) } });

    const serializedProfs = await this.profSerializer.bulkSerialize(profInstances);
    const serializedCourses = await this.courseSerializer.bulkSerialize(courseInstances);

    return serializedProfs.concat(serializedCourses);
  }
}

export default HydrateSerializer;
