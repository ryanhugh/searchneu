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
    feeAmount: DataTypes.INTEGER,
    feeDescription: DataTypes.STRING,
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

  Course.prototype.toEsJSON = function toEsJSON() {
    return _.pick(this.toJSON(), [
      'name', 'classId', 'termId', 'subject', 'crns',
    ]);
  };

  Course.prototype.toJSON = function toJSON() {
    const obj = this.dataValues;

    obj.lastUpdateTime = obj.lastUpdateTime.getTime();
    return _(obj).omit(['id', 'createdAt', 'updatedAt']).omitBy(_.isNil).value();
  };

  Course.bulkEsJSON = async (instances) => {
    return Course.bulkJSON(instances, [], ['lastUpdateTime', 'termId', 'host', 'subject', 'classId']);
  };

  Course.bulkJSON = async (instances, sectionCols, courseProps) => {
    const Section = sequelize.models.Section;

    const courseIds = instances.map((instance) => { return instance.id; });
    const sections = await Section.findAll({ where: { classHash: { [Op.in]: courseIds } } });

    const classToSections = _.groupBy(sections, 'classHash');

    return _(instances).keyBy('id').mapValues((instance) => {
      const coursePropVals = _.pick(instance, courseProps);
      let crns = [];
      let sectionObjs = [];

      const courseSections = classToSections[instance.id];
      if (courseSections) {
        crns = courseSections.map((section) => { return section.crn; });
        sectionObjs = courseSections.map((section) => { return { ..._.omit(section.toJSON(), sectionCols), ...coursePropVals }; });
      }

      const courseObj = instance.toJSON();
      courseObj.crns = crns;
      courseObj.sections = sectionObjs;

      return {
        class: courseObj,
        sections: sectionObjs,
        type: 'class',
      };
    })
      .value();
  };

  Course.bulkUpsertES = async (instances) => {
    const bulkCourses = await Course.bulkJSON(instances);
    await elastic.bulkIndexFromMap(elastic.CLASS_INDEX, bulkCourses);
  };

  Course.addHook('afterBulkCreate', async (instances) => { return Course.bulkUpsertES(instances); });
  Course.addHook('afterBulkUpdate', async ({ where }) => { return Course.bulkUpsertES(await Course.findAll({ where: where })); });

  return Course;
};
