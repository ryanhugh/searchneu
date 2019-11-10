'use strict';
module.exports = (sequelize, DataTypes) => {
  const MajorData = sequelize.define('MajorData', {
    majorId: DataTypes.STRING,
    catalogYear: DataTypes.STRING,
    majorName: DataTypes.STRING,
    major: DataTypes.JSON,
    planOfStudy: DataTypes.JSON
  }, {});
  MajorData.associate = function(models) {
    // associations can be defined here
  };
  return MajorData;
};