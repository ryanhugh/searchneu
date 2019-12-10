
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Professors', {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: Sequelize.STRING,
      },
      name: {
        type: Sequelize.STRING,
      },
      firstName: {
        type: Sequelize.STRING,
      },
      lastName: {
        type: Sequelize.STRING,
      },
      phone: {
        type: Sequelize.STRING,
      },
      emails: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
      primaryRole: {
        type: Sequelize.STRING,
      },
      primaryDepartment: {
        type: Sequelize.STRING,
      },
      url: {
        type: Sequelize.STRING,
      },
      streetAddress: {
        type: Sequelize.STRING,
      },
      personalSite: {
        type: Sequelize.STRING,
      },
      googleScholarId: {
        type: Sequelize.STRING,
      },
      bigPictureUrl: {
        type: Sequelize.STRING,
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
    return queryInterface.dropTable('Professors');
  },
};
