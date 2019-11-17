import { gql } from 'apollo-server';

const typeDef = gql`
  extend type Query {
    major(majorId: String!): Major
  }

  type Major {
    name: String!
    majorId: String!

    occurrence(year: Int!): MajorOccurrence
    latestOccurrence: MajorOccurrence
  }
`;

export default typeDef;
