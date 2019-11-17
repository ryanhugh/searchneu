import { gql } from 'apollo-server';

const typeDef = gql`
  type MajorOccurrence {
    name: String!
    majorId: String!
    catalogYear: Int!

    requirements: JSON
    plansOfStudy: JSON
  }
`;

export default typeDef;
