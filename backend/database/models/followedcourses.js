'use strict';
module.exports = (sequelize, DataTypes) => {
  const FollowedCourses = sequelize.define('FollowedCourses', {
    user_id: DataTypes.STRING,
    course_id: DataTypes.STRING
  }, {});
  FollowedCourses.associate = function(models) {
    // associations can be defined here
  };
  return FollowedCourses;
};