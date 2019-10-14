import { ApolloServer, gql } from 'apollo-server';
import GraphQLJSON from 'graphql-type-json';

import elastic from './elastic';
import Keys from '../common/Keys';

const typeDefs = gql`
  scalar JSON

  type Class {
    name: String!
    subject: String!
    classId: Int!

    occurrence(termId: Int!): ClassOccurrence
    latestOccurrence: ClassOccurrence
    allOccurrences: [ClassOccurrence]!
  }

  type ClassOccurrence {
    name: String!
    subject: String!
    classId: Int!
    termId: Int!

    desc: String
    prereqs: JSON
  }

  type Query {
    class(subject: String!, classId: Int!): Class
  }
`;

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
  JSON: GraphQLJSON,
  Query: {
    class: (parent, args) => { return elastic.getLatestClassOccurrence('neu.edu', args.subject, args.classId); },
  },
  Class: {
    latestOccurrence: (clas) => { return elastic.getLatestClassOccurrence('neu.edu', clas.subject, clas.classId); },
    allOccurrences: (clas) => { return elastic.getAllClassOccurrences('neu.edu', clas.subject, clas.classId); },
    occurrence: (clas, args) => { return getClassOccurence('neu.edu', clas.subject, clas.classId, args.termId.toString()); },
  },
};

const server = new ApolloServer({ typeDefs: typeDefs, resolvers: resolvers });
server.listen().then(({ url }) => {
  console.log(`ready at ${url}`);
});
