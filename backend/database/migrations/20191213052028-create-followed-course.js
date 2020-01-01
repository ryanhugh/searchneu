
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('FollowedCourses', {
      userId: {
        type: Sequelize.STRING,
        references: {
          model: 'Users',
          key: 'id',
        },
        allowNull: false,
      },
      courseId: {
        type: Sequelize.STRING,
        references: {
          model: 'Courses',
          key: 'id',
        },
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    }).then(() => {
      return queryInterface.addConstraint('FollowedCourses', ['userId', 'courseId'], {
        type: 'primary key',
        name: 'followed_courses_pkey',
      });
    });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('FollowedCourses');
  },
};
