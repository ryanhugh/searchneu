
module.exports = (sequelize, DataTypes) => {
  const Meeting = sequelize.define('Meeting', {
    startDate: DataTypes.INTEGER,
    endDate: DataTypes.INTEGER,
    profs: DataTypes.ARRAY(DataTypes.INTEGER),
    times: DataTypes.JSON,
    sectionId: {
      type: DataTypes.INTEGER,
      references: 'Sections',
      referencesKey: 'id',
    },
  }, {});

  return Meeting;
};
