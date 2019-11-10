'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('MajorData', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      majorId: {
        type: Sequelize.STRING
      },
      catalogYear: {
        type: Sequelize.STRING
      },
      majorName: {
        type: Sequelize.STRING
      },
      major: {
        type: Sequelize.JSON
      },
      planOfStudy: {
        type: Sequelize.JSON
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('MajorData');
  }
};