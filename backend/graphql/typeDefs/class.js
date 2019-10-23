import { gql } from 'apollo-server';

const typeDef = gql`
  extend type Query {
    class(subject: String!, classId: Int!): Class
  }

  type Class {
    name: String!
    subject: String!
    classId: Int!

    occurrence(termId: Int!): ClassOccurrence
    latestOccurrence: ClassOccurrence
    allOccurrences: [ClassOccurrence]!
  }
`;

export default typeDef;
