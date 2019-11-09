import { gql } from 'apollo-server';

const typeDef = gql`
  type MajorOccurrence {
    name: String!
    majorId: Int!
    catalogYear: Int!

    requirements: JSON
    plansofstudy: JSON
  }
`;

export default typeDef;
