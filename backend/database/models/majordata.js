
module.exports = (sequelize, DataTypes) => {
  const MajorData = sequelize.define('MajorData', {
    majorId: DataTypes.STRING,
    catalogYear: DataTypes.INTEGER,
    name: DataTypes.STRING,
    requirements: DataTypes.JSON,
    plansOfStudy: DataTypes.JSON,
  }, {});

  return MajorData;
};
