'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('FollowedCourses', {
      user_id: {
        type: Sequelize.STRING,
        references: {
          model: 'Users',
          key: 'id',
        },
        allowNull: false,
      },
      course_id: {
        type: Sequelize.STRING,
        references: {
          model: 'Courses',
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
      return queryInterface.addConstraint('FollowedCourses', ['user_id', 'course_id'], {
        type: 'primary key',
        name: 'followed_course_pkey',
      });
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('FollowedCourses');
  }
};
