import db from '../../../models/index';

const MajorData = db.MajorData;

const getLatestMajorOccurrence = async (majorId) => {
  return MajorData.findAll({
    where: { majorId: args.majorId },
    order: [['catalogYear', 'DESC']],
    limit: 1,
  });
};

const resolvers = {
  Query: {
    major: (parent, args) => { return getLatestMajorOccurrence(args.majorId); },
  },
  Major: {
    occurrence: (major, args) => {
      return MajorData.findAll({
        where: { majorId: major.majorId, catalogYear: String(args.year) },
        order: [['catalogYear', 'DESC']],
        limit: 1,
      });
    },
    latestOccurrence: (major) => { return getLatestMajorOccurrence(major.majorId); },
  },
};

export default resolvers;
