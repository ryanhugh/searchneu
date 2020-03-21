/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import HydrateCourseSerializer from '../../database/serializers/hydrateCourseSerializer';
import { Course, Section } from '../../database/models/index';

const serializer = new HydrateCourseSerializer(Section);

const serializeValues = (results) => {
  return results.map((result) => serializer.serializeCourse(result));
}

const getLatestClassOccurrence = async (host, subject, classId) => {
  const res = await Course.findOne({ where: { host, subject, classId }, order: [['termId', 'DESC']] });
  return serializeValues([res])[0];
}

const getAllClassOccurrences = async (host, subject, classId) => {
  const results = await Course.findAll({ where: { host, subject, classId } });
  return serializeValues(results);
}

const getClassOccurrence = async (host, subject, classId, termId) => {
  const res = await Course.findOne({
    where: {
      host, subject, classId, termId,
    },
  });
  return serializeValues([res])[0];
}

const resolvers = {
  Query: {
    class: (parent, args) => { return getLatestClassOccurrence('neu.edu', args.subject, args.classId && args.classId.toString()); },
  },
  Class: {
    latestOccurrence: (clas) => { return getLatestClassOccurrence('neu.edu', clas.subject, clas.classId); },
    allOccurrences: (clas) => { return getAllClassOccurrences('neu.edu', clas.subject, clas.classId); },
    occurrence: (clas, args) => { return getClassOccurrence('neu.edu', clas.subject, clas.classId, args.termId.toString()); },
  },
};

export default resolvers;
