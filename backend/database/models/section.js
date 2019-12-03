
module.exports = (sequelize, DataTypes) => {
  const Section = sequelize.define('Section', {
    id: {
      allowNull: false,
      autoIncrement: false,
      primaryKey: true,
      type: DataTypes.STRING,
    },
    seatsCapacity: DataTypes.INTEGER,
    seatsRemaining: DataTypes.INTEGER,
    waitCapacity: DataTypes.INTEGER,
    waitRemaining: DataTypes.INTEGER,
    online: DataTypes.BOOLEAN,
    honors: DataTypes.BOOLEAN,
    url: DataTypes.STRING,
    crn: DataTypes.STRING,
    meetings: DataTypes.JSON,
    classHash: {
      type: DataTypes.STRING,
      references: 'Courses',
      referencesKey: 'id',
    },
  }, {});

  return Section;
};
