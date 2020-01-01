
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      primaryKey: true,
      type: DataTypes.STRING,
      allowNull: false,
      autoIncrement: false,
    },
    facebookPageId: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    loginKeys: DataTypes.ARRAY(DataTypes.STRING),
  }, {});

  User.associate = (models) => {
    User.belongsToMany(models.Course, {
      through: 'FollowedCourse',
      as: 'followedCourses',
      foreignKey: 'userId',
    });

    User.belongsToMany(models.Section, {
      through: 'FollowedSection',
      as: 'followedSections',
      foreignKey: 'userId',
    });
  };

  return User;
};
