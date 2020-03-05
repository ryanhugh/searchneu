
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Sections', 'info', Sequelize.TEXT);
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('Sections', 'info');
  },
};
