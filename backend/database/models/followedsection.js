
module.exports = (sequelize, DataTypes) => {
  const FollowedSections = sequelize.define('FollowedSection', {
    userId: DataTypes.STRING,
    sectionId: DataTypes.STRING,
  }, {});

  return FollowedSections;
};
