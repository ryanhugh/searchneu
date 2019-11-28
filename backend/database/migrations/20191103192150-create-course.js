
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Courses', {
      id: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
        type: Sequelize.STRING,
      },
      maxCredits: {
        type: Sequelize.INTEGER,
      },
      minCredits: {
        type: Sequelize.INTEGER,
      },
      desc: {
        type: Sequelize.TEXT,
      },
      classId: {
        type: Sequelize.STRING,
      },
      url: {
        type: Sequelize.STRING,
      },
      prettyurl: {
        type: Sequelize.STRING,
      },
      name: {
        type: Sequelize.STRING,
      },
      lastUpdateTime: {
        type: Sequelize.DATE,
      },
      termId: {
        type: Sequelize.STRING,
      },
      host: {
        type: Sequelize.STRING,
      },
      subject: {
        type: Sequelize.STRING,
      },
      prereqs: {
        type: Sequelize.JSON,
      },
      coreqs: {
        type: Sequelize.JSON,
      },
      prereqsFor: {
        type: Sequelize.JSON,
      },
      optPrereqsFor: {
        type: Sequelize.JSON,
      },
      classAttributes: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    }).then(() => { return queryInterface.addIndex('Courses', ['classId', 'termId', 'subject']); });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Courses');
  },
};
