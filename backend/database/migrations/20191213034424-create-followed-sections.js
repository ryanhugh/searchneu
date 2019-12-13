'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('FollowedSections', {
      user_id: {
        type: Sequelize.STRING,
        references: {
          model: 'Users',
          key: 'id',
        },
        allowNull: false,
      },
      section_id: {
        type: Sequelize.STRING,
        references: {
          model: 'Sections',
          key: 'id',
        },
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }).then(() => {
      return queryInterface.addConstraint('FollowedSections', ['user_id', 'section_id'], { 
        type: 'primary key', 
        name: 'followed_section_pkey',
      });
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('FollowedSections');
  }
};
