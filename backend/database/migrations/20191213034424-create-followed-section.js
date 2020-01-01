
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('FollowedSections', {
      userId: {
        type: Sequelize.STRING,
        references: {
          model: 'Users',
          key: 'id',
        },
        allowNull: false,
      },
      sectionId: {
        type: Sequelize.STRING,
        references: {
          model: 'Sections',
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
      return queryInterface.addConstraint('FollowedSections', ['userId', 'sectionId'], {
        type: 'primary key',
        name: 'followed_sections_pkey',
      });
    });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('FollowedSections');
  },
};
