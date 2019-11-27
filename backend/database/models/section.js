
module.exports = (sequelize, DataTypes) => {
  const Section = sequelize.define('Section', {
    seatsCapacity: DataTypes.INTEGER,
    seatsRemaining: DataTypes.INTEGER,
    waitCapacity: DataTypes.INTEGER,
    waitRemaining: DataTypes.INTEGER,
    online: DataTypes.BOOLEAN,
    honors: DataTypes.BOOLEAN,
    url: DataTypes.STRING,
    crn: DataTypes.STRING,
    classId: {
      type: DataTypes.INTEGER,
      references: 'Courses',
      referencesKey: 'id',
    },
  }, {});

  return Section;
};
