import elastic from '../../elastic';
import Keys from '../../../common/Keys';

const getClassOccurence = async (host, subject, classId, termId) => {
  try {
    const id = Keys.getClassHash({
      host: host, subject: subject, classId: classId, termId: termId,
    });
    const s = await elastic.get(elastic.CLASS_INDEX, id);
    return s.class;
  } catch (err) {
    if (err.statusCode === 404) {
      return null;
    }
    throw err;
  }
};

const resolvers = {
  Query: {
    class: (parent, args) => { return elastic.getLatestClassOccurrence('neu.edu', args.subject, args.classId); },
  },
  Class: {
    latestOccurrence: (clas) => { return elastic.getLatestClassOccurrence('neu.edu', clas.subject, clas.classId); },
    allOccurrences: (clas) => { return elastic.getAllClassOccurrences('neu.edu', clas.subject, clas.classId); },
    occurrence: (clas, args) => { return getClassOccurence('neu.edu', clas.subject, clas.classId, args.termId.toString()); },
  },
};

export default resolvers;
