/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import HydrateCourseSerializer from '../../database/serializers/hydrateCourseSerializer';
import { Course, Section } from '../../database/models/index';

const serializer = new HydrateCourseSerializer(Section);

const serializeValues = async (results) => {
  return Object.values(await serializer.bulkSerialize(results));
}

const getLatestClassOccurrence = async (host, subject, classId) => {
  const res = await Course.findOne({ where: { host, subject, classId } });
  return (await serializeValues([res]))[0].class;
}

const getAllClassOccurrences = async (host, subject, classId) => {
  const results = await Course.findAll({ where: { host, subject, classId }, limit: 10 });
  return (await serializeValues(results)).map((c) => c.class);
}

const getClassOccurrence = async (host, subject, classId, termId) => {
  const res = await Course.findOne({
    where: {
      host, subject, classId, termId,
    },
  });
  return (await serializeValues([res]))[0].class;
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
