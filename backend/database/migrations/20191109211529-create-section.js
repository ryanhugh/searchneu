'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Sections', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      seatsCapacity: {
        type: Sequelize.INTEGER
      },
      seatsRemaining: {
        type: Sequelize.INTEGER
      },
      waitCapacity: {
        type: Sequelize.INTEGER
      },
      waitRemaining: {
        type: Sequelize.INTEGER
      },
      online: {
        type: Sequelize.BOOLEAN
      },
      honors: {
        type: Sequelize.BOOLEAN
      },
      url: {
        type: Sequelize.STRING
      },
      crn: {
        type: Sequelize.STRING
      },
      classId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Courses",
          key: 'id'
        }
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
    return queryInterface.dropTable('Sections');
  }
};