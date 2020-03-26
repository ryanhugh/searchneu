module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Courses', 'nupath', Sequelize.ARRAY(Sequelize.STRING));
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn('Courses', 'nupath');
  },
};
