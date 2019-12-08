
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Sections', {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: Sequelize.STRING,
      },
      seatsCapacity: {
        type: Sequelize.INTEGER,
      },
      seatsRemaining: {
        type: Sequelize.INTEGER,
      },
      waitCapacity: {
        type: Sequelize.INTEGER,
      },
      waitRemaining: {
        type: Sequelize.INTEGER,
      },
      online: {
        type: Sequelize.BOOLEAN,
      },
      honors: {
        type: Sequelize.BOOLEAN,
      },
      url: {
        type: Sequelize.STRING,
      },
      crn: {
        type: Sequelize.STRING,
      },
      meetings: {
        type: Sequelize.JSON,
      },
      classHash: {
        type: Sequelize.STRING,
        references: {
          model: 'Courses',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Sections');
  },
};
