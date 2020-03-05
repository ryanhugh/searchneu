'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Sections', 'profs', Sequelize.ARRAY(Sequelize.STRING));
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Sections', 'profs');
  }
};
