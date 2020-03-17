import ProfSerializer from './profSerializer';

class ElasticProfSerializer extends ProfSerializer {
  profCols() {
    return ['name', 'emails', 'phone'];
  }
}

export default ElasticProfSerializer;
