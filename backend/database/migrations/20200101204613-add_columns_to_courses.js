
module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('Courses', 'feeAmount', Sequelize.INTEGER),
      queryInterface.addColumn('Courses', 'feeDescription', Sequelize.STRING),
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn('Courses', 'feeAmount'),
      queryInterface.removeColumn('Courses', 'feeDescription'),
    ]);
  },
};
