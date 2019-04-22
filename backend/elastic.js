import { Client } from '@elastic/elasticsearch';

const Elastic = new Client({ node: 'http://192.168.99.100:9200' });

Elastic.resetIndex = async (indexName, mapping) => {
  // Clear out the index.
  await Elastic.indices.delete({ index: indexName }).catch(() => {});
  try {
    // Put in the new classes mapping (elasticsearch doesn't let you change mapping of existing index)
    await Elastic.indices.create({
      index: indexName,
      body: mapping,
    });
  } catch (error) {
    throw new Error(error);
  }
};

export default Elastic;
