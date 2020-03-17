import _ from 'lodash';

/* eslint-disable no-underscore-dangle */
class ProfSerializer {
  async bulkSerialize(instances) {
    return instances.map((instance) => this._bulkSerializeProf(this._serializeProf(instance)));
  }

  _bulkSerializeProf(prof) {
    return {
      employee: prof,
      type: 'employee',
    };
  }

  _serializeProf(instance) {
    return _(instance.dataValues).pick(this.profCols()).value();
  }
}

export default ProfSerializer;
