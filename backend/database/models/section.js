
module.exports = (sequelize, DataTypes) => {
  const Section = sequelize.define('Section', {
    sectionHash: DataTypes.STRING,
    seatsCapacity: DataTypes.INTEGER,
    seatsRemaining: DataTypes.INTEGER,
    waitCapacity: DataTypes.INTEGER,
    waitRemaining: DataTypes.INTEGER,
    online: DataTypes.BOOLEAN,
    honors: DataTypes.BOOLEAN,
    url: DataTypes.STRING,
    crn: DataTypes.STRING,
<<<<<<< HEAD:backend/database/models/section.js
    classId: {
      type: DataTypes.INTEGER,
      references: 'Courses',
      referencesKey: 'id',
    },
=======
    meetings: DataTypes.JSON,
    classHash: {
      type: DataTypes.STRING,
      references: "Courses",
      referencesKey: 'classHash'
    }
>>>>>>> correcting section data types and structure and moving directory structure a bit:backend/models/section.js
  }, {});

  return Section;
};
