import db from '../../../models/index';
const { UserInputError } = require('apollo-server');

const MajorData = db.MajorData;

const noResultsError = (recordType) => {
  throw new UserInputError(`${recordType} not found!`);
};

const getLatestMajorOccurrence = async (majorId, recordType) => {
  const response = await MajorData.findOne({
    where: { majorId: majorId },
    order: [['catalogYear', 'DESC']],
    limit: 1,
  });

  return (response ? response : noResultsError(recordType) );
};

const resolvers = {
  Query: {
    major: (parent, args) => { return getLatestMajorOccurrence(args.majorId, 'major'); },
  },
  Major: {
    occurrence: async (major, args) => {
      const response = await MajorData.findOne({
        where: { majorId: major.majorId, catalogYear: args.year },
        limit: 1,
      });
      return (response ? response : noResultsError('occurrence') );
    },
    latestOccurrence: (major) => { return getLatestMajorOccurrence(major.majorId, 'latestOccurrence'); },
  },
};

export default resolvers;
