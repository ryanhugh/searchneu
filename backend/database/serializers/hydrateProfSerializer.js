/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import _ from 'lodash';
import ProfSerializer from './profSerializer';
import { Professor } from '../models/index';

class HydrateProfSerializer extends ProfSerializer {
  profCols() {
    return Object.keys(_.omit(Professor.rawAttributes, ['createdAt', 'updatedAt']));
  }
}

export default HydrateProfSerializer;
