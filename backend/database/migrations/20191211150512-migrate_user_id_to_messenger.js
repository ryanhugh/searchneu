
module.exports = {
  up: (queryInterface) => {
    return queryInterface.removeConstraint('Users', 'Users_pkey').then(() => {
      return queryInterface.removeColumn('Users', 'id').then(() => {
        return queryInterface.renameColumn('Users', 'messengerId', 'id').then(() => {
          return queryInterface.addConstraint('Users', ['id'], {
            type: 'primary key',
            name: 'Users_pkey',
          });
        });
      });
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Users', {}).then(() => {
      return queryInterface.removeConstraint('Users', 'Users_pkey').then(() => {
        return queryInterface.renameColumn('Users', 'id', 'messengerId').then(() => {
          return queryInterface.addColumn('Users', 'id', Sequelize.INTEGER).then(() => {
            return queryInterface.addConstraint('Users', ['id'], {
              type: 'primary key',
              name: 'Users_pkey',
            });
          });
        });
      });
    });
  },
};
