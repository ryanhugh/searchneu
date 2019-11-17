import db from '../../../models/index';

const MajorData = db.MajorData;

const getLatestMajorOccurrence = async (majorId) => {
  return MajorData.findOne({
    where: { majorId: majorId },
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
      return MajorData.findOne({
        where: { majorId: major.majorId, catalogYear: args.year },
        limit: 1,
      });
    },
    latestOccurrence: (major) => { return getLatestMajorOccurrence(major.majorId); },
  },
};

export default resolvers;
