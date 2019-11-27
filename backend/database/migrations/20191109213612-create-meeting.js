
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Meetings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      startDate: {
        type: Sequelize.INTEGER,
      },
      endDate: {
        type: Sequelize.INTEGER,
      },
      profs: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
      },
      times: {
        type: Sequelize.JSON,
      },
      sectionId:  {
        type:  Sequelize.INTEGER,
        references: {
          model: 'Sections',
          key: 'id',
        },
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
    return queryInterface.dropTable('Meetings');
  },
};
