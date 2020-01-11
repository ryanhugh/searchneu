
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Professors', 'email', Sequelize.STRING),
      queryInterface.addColumn('Professors', 'pic', Sequelize.JSON),
      queryInterface.addColumn('Professors', 'link', Sequelize.STRING),
      queryInterface.addColumn('Professors', 'officeRoom', Sequelize.STRING),
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('Professors', 'officeRoom'),
      queryInterface.removeColumn('Professors', 'pic'),
      queryInterface.removeColumn('Professors', 'link'),
      queryInterface.removeColumn('Professors', 'email'),
    ]);
  },
};
