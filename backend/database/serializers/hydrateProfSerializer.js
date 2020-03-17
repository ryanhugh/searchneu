import _ from 'lodash';
import ProfSerializer from './profSerializer';
import { Professor } from '../models/index';

class HydrateProfSerializer extends ProfSerializer {
  profCols() {
    return Object.keys(_.omit(Professor.rawAttributes, ['id', 'createdAt', 'updatedAt']));
  }
}

export default HydrateProfSerializer;
