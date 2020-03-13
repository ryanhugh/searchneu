
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Sections', 'profs', Sequelize.ARRAY(Sequelize.STRING));
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('Sections', 'profs');
  },
};
