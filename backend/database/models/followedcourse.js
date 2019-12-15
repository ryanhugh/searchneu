
module.exports = (sequelize, DataTypes) => {
  const FollowedCourses = sequelize.define('FollowedCourse', {
    userId: DataTypes.STRING,
    courseId: DataTypes.STRING,
  }, {});

  return FollowedCourses;
};
