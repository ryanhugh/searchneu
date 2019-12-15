'use strict';
module.exports = (sequelize, DataTypes) => {
  const FollowedCourses = sequelize.define('FollowedCourses', {
    userId: DataTypes.STRING,
    courseId: DataTypes.STRING
  }, {});
  FollowedCourses.associate = function(models) {
    // associations can be defined here
  };
  return FollowedCourses;
};
