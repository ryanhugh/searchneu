const { ApolloServer, gql } = require('apollo-server');
const { filter, find } = require('lodash');

const typeDefs = gql`
  type Class {
    name: String
    subject: String
    classId: Int

    occurrences: [ClassOccurrence]
    latestOccurrence: ClassOccurrence
  }

  type ClassOccurrence {
    name: String
    subject: String
    sections: String
    termId: Int
  }

  type Query {
    class(subject: String, classId: Int): Class
    classOccurrence(subject: String, classId: Int, termId: Int): ClassOccurrence
  }
`;

const classes = [
  {
    name: 'Fundies',
    subject: 'CS',
    classId: 2500,
    termId: 201930,
  },
  {
    name: 'Fundies',
    subject: 'CS',
    classId: 2500,
    termId: 201830,
  },
  {
    name: 'OOD',
    subject: 'CS',
    classId: 3500,
  },
];

const resolvers = {
  Query: {
    class: (parent, args) => { return find(classes, { classId: args.classId }); },
    classOccurrence: (parent, args) => { return find(classes, args); },
  },
  Class: {
    latestOccurrence: (clas) => { return find(classes, { classId: clas.classId }); },
    occurrences: (clas ) => { return filter(classes, { classId: clas.classId }); },
  },
};

const server = new ApolloServer({ typeDefs: typeDefs, resolvers: resolvers });
server.listen().then(({ url }) => {
  console.log(`ready at ${url}`);
});
