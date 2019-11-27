'use strict';
module.exports = (sequelize, DataTypes) => {
  const Professor = sequelize.define('Professor', {
    name: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    phone: DataTypes.STRING,
    profId: DataTypes.STRING,
    emails: DataTypes.ARRAY(DataTypes.STRING),
    primaryRole: DataTypes.STRING,
    primaryDepartment: DataTypes.STRING,
    url: DataTypes.STRING,
    streetAddress: DataTypes.STRING,
    personalSite: DataTypes.STRING,
    googleScholarId: DataTypes.STRING,
    bigPictureUrl: DataTypes.STRING
  }, {});
  Professor.associate = function(models) {
    // associations can be defined here
  };
  return Professor;
};