'use strict';
module.exports = (sequelize, DataTypes) => {
  const Major = sequelize.define('Major', {
    catalogYear: DataTypes.STRING,
    data: DataTypes.JSON
  }, {});
  Major.associate = function(models) {
    // associations can be defined here
    
  };
  return Major;
};