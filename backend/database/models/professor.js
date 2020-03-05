import _ from 'lodash';
import elastic from '../../elastic';

module.exports = (sequelize, DataTypes) => {
  const Professor = sequelize.define('Professor', {
    id: {
      allowNull: false,
      autoIncrement: false,
      primaryKey: true,
      type: DataTypes.STRING,
    },
    name: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    phone: DataTypes.STRING,
    emails: DataTypes.ARRAY(DataTypes.STRING),
    primaryRole: DataTypes.STRING,
    primaryDepartment: DataTypes.STRING,
    url: DataTypes.STRING,
    streetAddress: DataTypes.STRING,
    personalSite: DataTypes.STRING,
    googleScholarId: DataTypes.STRING,
    bigPictureUrl: DataTypes.STRING,
    email: DataTypes.STRING,
    pic: DataTypes.JSON,
    link: DataTypes.STRING,
    officeRoom: DataTypes.STRING,
  }, {});

  Professor.prototype.toJSON = function toJSON() {
    const obj = this.dataValues;
    return _(obj).omit(['createdAt', 'updatedAt']).omitBy(_.isNil).value();
  };

  Professor.bulkUpsertES = async (instances) => {
    const bulkProfessors = _(instances).keyBy('id').mapValues((instance) => {
      return { employee: instance.toJSON(), type: 'employee' };
    }).value();
    return elastic.bulkIndexFromMap(elastic.EMPLOYEE_INDEX, bulkProfessors);
  };

  Professor.addHook('afterBulkCreate', async (instances) => { return Professor.bulkUpsertES(instances); });
  Professor.addHook('afterBulkUpdate', async ({ where }) => { return Professor.bulkUpsertES(await Professor.findAll({ where: where })); });

  return Professor;
};
