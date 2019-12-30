import _ from 'lodash';
import { Op } from 'sequelize';
import elastic from '../../elastic';

module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: {
      allowNull: false,
      autoIncrement: false,
      primaryKey: true,
      type: DataTypes.STRING,
    },
    maxCredits: DataTypes.INTEGER,
    minCredits: DataTypes.INTEGER,
    desc: DataTypes.TEXT,
    classId: DataTypes.STRING,
    url: DataTypes.STRING,
    prettyUrl: DataTypes.STRING,
    name: DataTypes.STRING,
    lastUpdateTime: DataTypes.DATE,
    termId: DataTypes.STRING,
    host: DataTypes.STRING,
    subject: DataTypes.STRING,
    prereqs: DataTypes.JSON,
    coreqs: DataTypes.JSON,
    prereqsFor: DataTypes.JSON,
    optPrereqsFor: DataTypes.JSON,
    classAttributes: DataTypes.ARRAY(DataTypes.STRING),
  }, {});

  Course.associate = (models) => {
    Course.belongsToMany(models.User, {
      through: 'FollowedCourse',
      as: 'followers',
      foreignKey: 'courseId',
    });

    Course.hasMany(models.Section, {
      foreignKey: 'classHash',
    });
  };

  Course.prototype.to_json = function() {
    const obj = this.dataValues;

    let omitColumns = ['id', 'createdAt', 'updatedAt'];

    omitColumns = omitColumns.concat(['prereqs', 'coreqs', 'prereqsFor', 'optPrereqsFor'].filter(prop => obj[prop] === null));

    obj.lastUpdateTime = obj.lastUpdateTime.getTime();

    return _.omit(obj, omitColumns);
  }

  Course.bulkUpsertEs = async (instances) => {
    const Section = sequelize.models.Section;

    const courseIds = instances.map(instance => instance.id);
    const sections = await Section.findAll({ where: { classHash: { [Op.in]: courseIds } } });

    const classToSections = _.groupBy(sections, 'classHash');

    const bulkCourses = _(instances).keyBy('id')
      .mapValues(instance => {
        const courseProps = { lastUpdateTime: instance.lastUpdateTime.getTime(), termId: instance.termId, host: instance.host, subject: instance.subject, classId: instance.classId };

        const courseSections = classToSections[instance.id];
        const crns = courseSections.map(section => section.crn);
        const sectionObjs = courseSections.map(section => { return { ...section.to_json(), ...courseProps } });

        const courseObj = instance.to_json();
        courseObj.crns = crns;
        courseObj.sections = sectionObjs;

        return {
          "class": courseObj,
          sections: sectionObjs,
        };

      })
      .value();

    await elastic.bulkIndexFromMap(elastic.CLASS_INDEX, bulkCourses);
  };

  Course.addHook('afterBulkCreate', async (instances) => { return Course.bulk_upsert_es(instances); });

  return Course;
};
