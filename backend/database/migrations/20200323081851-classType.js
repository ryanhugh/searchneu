module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Sections', 'classType', Sequelize.STRING);
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('Sections', 'classType');
  },
};
