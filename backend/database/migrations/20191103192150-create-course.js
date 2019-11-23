
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Courses', {
      classHash: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
<<<<<<< HEAD:backend/database/migrations/20191103192150-create-course.js
        type: Sequelize.INTEGER,
=======
        type: Sequelize.STRING
>>>>>>> correcting section data types and structure and moving directory structure a bit:migrations/20191103192150-create-course.js
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
        allowNull: false,
        unique: 'classKeyIndex',
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
        allowNull: false,
        unique: 'classKeyIndex',
      },
      host: {
        type: Sequelize.STRING,
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: 'classKeyIndex',
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
    });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Courses');
  },
};
