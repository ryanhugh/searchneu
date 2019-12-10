
module.exports = (sequelize, DataTypes) => {
  const Professor = sequelize.define('Professor', {
    id: {
      allowNull: false,
      autoIncrement: false,
      primaryKey: true,
      type: DataTypes.STRING,
    },
    name: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    phone: DataTypes.STRING,
    emails: DataTypes.ARRAY(DataTypes.STRING),
    primaryRole: DataTypes.STRING,
    primaryDepartment: DataTypes.STRING,
    url: DataTypes.STRING,
    streetAddress: DataTypes.STRING,
    personalSite: DataTypes.STRING,
    googleScholarId: DataTypes.STRING,
    bigPictureUrl: DataTypes.STRING,
  }, {});

  return Professor;
};
