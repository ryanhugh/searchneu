import elastic from './elastic';
import classMap from './scrapers/classes/classMapping.json';
import employeeMap from './scrapers/employees/employeeMapping.json';

if (require.main === module) {
  (async () => {
    await elastic.resetIndex('classes', classMap);
    await elastic.resetIndex('employees', employeeMap);
  })();
}
