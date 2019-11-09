import { gql } from 'apollo-server';

const typeDef = gql`
  extend type Query {
    major(majorId: Int!): Major
  }

  type Major {
    name: String!
    majorId: Int!

    occurrence(year: Int!): MajorOccurrence
    latestOccurrence: MajorOccurrence
  }
`;

export default typeDef;
