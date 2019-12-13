'use strict';
module.exports = (sequelize, DataTypes) => {
  const FollowedSections = sequelize.define('FollowedSections', {
    user_id: DataTypes.STRING,
    section_id: DataTypes.STRING
  }, {});
  FollowedSections.associate = function(models) {
    // associations can be defined here
  };
  return FollowedSections;
};