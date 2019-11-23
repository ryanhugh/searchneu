
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Sections', {
      sectionHash: {
        allowNull: false,
        autoIncrement: false,
        primaryKey: true,
<<<<<<< HEAD:backend/database/migrations/20191109211529-create-section.js
        type: Sequelize.INTEGER,
=======
        type: Sequelize.STRING
>>>>>>> correcting section data types and structure and moving directory structure a bit:migrations/20191109211529-create-section.js
      },
      seatsCapacity: {
        type: Sequelize.INTEGER,
      },
      seatsRemaining: {
        type: Sequelize.INTEGER,
      },
      waitCapacity: {
        type: Sequelize.INTEGER,
      },
      waitRemaining: {
        type: Sequelize.INTEGER,
      },
      online: {
        type: Sequelize.BOOLEAN,
      },
      honors: {
        type: Sequelize.BOOLEAN,
      },
      url: {
        type: Sequelize.STRING,
      },
      crn: {
        type: Sequelize.STRING,
      },
      meetings: {
        type: Sequelize.JSON
      },
      classHash: {
        type: Sequelize.STRING,
        references: {
<<<<<<< HEAD:backend/database/migrations/20191109211529-create-section.js
          model: 'Courses',
          key: 'id',
        },
=======
          model: "Courses",
          key: 'classHash'
        }
>>>>>>> correcting section data types and structure and moving directory structure a bit:migrations/20191109211529-create-section.js
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
    return queryInterface.dropTable('Sections');
<<<<<<< HEAD:backend/database/migrations/20191109211529-create-section.js
  },
=======
  }
>>>>>>> correcting section data types and structure and moving directory structure a bit:migrations/20191109211529-create-section.js
};
