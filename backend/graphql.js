const { ApolloServer, gql } = require('apollo-server');
const GraphQLJSON = require('graphql-type-json');
const { filter, find } = require('lodash');

const typeDefs = gql`
  scalar JSON

  type Class {
    name: String
    subject: String
    classId: Int

    occurrence(termId: Int!): ClassOccurrence
    latestOccurrence: ClassOccurrence
    allOccurrences: [ClassOccurrence]
  }

  type ClassOccurrence {
    name: String
    desc: String
    subject: String
    classId: Int
    termId: Int
    prereq: JSON
  }

  type Query {
    class(subject: String!, classId: Int!): Class
  }
`;

const classes = [
  {
    name: 'Fundies',
    desc: 'Blah blah blah',
    subject: 'CS',
    classId: 2500,
    termId: 201930,
  },
  {
    name: 'Fundies',
    desc: 'blub blub blub',
    subject: 'CS',
    classId: 2500,
    termId: 201830,
  },
  {
    name: 'OOD',
    desc: 'OOOOOOOOOOOOOOOOOOOOOO',
    subject: 'CS',
    classId: 3500,
  },
];

const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    class: (parent, args) => { return find(classes, args); },
    // classOccurrence: (parent, args) => { return find(classes, args); },
  },
  Class: {
    latestOccurrence: (clas) => { return find(classes, { classId: clas.classId }); },
    allOccurrences: (clas) => { return filter(classes, { classId: clas.classId }); },
    occurence: (clas, args) => { return find(classes, { classId: clas.classId, termId: args.termId }); },
  },
};

const server = new ApolloServer({ typeDefs: typeDefs, resolvers: resolvers });
server.listen().then(({ url }) => {
  console.log(`ready at ${url}`);
});
