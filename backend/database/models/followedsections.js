'use strict';
module.exports = (sequelize, DataTypes) => {
  const FollowedSections = sequelize.define('FollowedSections', {
    userId: DataTypes.STRING,
    sectionId: DataTypes.STRING
  }, {});
  FollowedSections.associate = function(models) {
  };
  return FollowedSections;
};
