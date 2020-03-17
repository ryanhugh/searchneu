import _ from 'lodash';

class ProfSerializer {
  async bulkSerialize(instances) {
    return instances.map(instance => this.bulkSerializeProf(this.serializeProf(instance)));
  }

  bulkSerializeProf(prof) {
    return {
      employee: prof,
      type: 'employee'
    };
  }

  serializeProf(instance) {
    return _(instance.dataValues).pick(this.profCols()).value();
  }
}

export default ProfSerializer;
