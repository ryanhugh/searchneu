
module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameColumn('Courses', 'prettyurl', 'prettyUrl');
  },

  down: (queryInterface) => {
    return queryInterface.renameColumn('Courses', 'prettyUrl', 'prettyurl');
  },
};
