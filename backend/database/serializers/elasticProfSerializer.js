/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import ProfSerializer from './profSerializer';

class ElasticProfSerializer extends ProfSerializer {
  profCols() {
    return ['name', 'emails', 'phone'];
  }
}

export default ElasticProfSerializer;
