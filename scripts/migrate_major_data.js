import fs from 'fs-extra';
import path from 'path';

import db from '../backend/database/models/index';

const MajorData = db.MajorData;

const logSuccess = (result) => {
  console.log(`Congratulations! You have created the ${result.name} major!`);
}

const biochemPlansOfStudy = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'plans-2018-biochem.json')));
const biochemRequirements = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'BIOCHEMISTRY,\ BS.txt')));

MajorData.create({ 
  requirements: biochemRequirements, 
  plansOfStudy: biochemPlansOfStudy, 
  catalogYear: 2018, 
  name: 'biochem', 
  majorId: 'science/biochemistry/biochemistry-bs' 
}).then((result) => { logSuccess(result) });

const mathPlansOfStudy = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'plans-2018-math.json')));
const mathRequirements = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'MATHEMATICS,\ BS.txt')));

MajorData.create({ 
  requirements: mathRequirements, 
  plansOfStudy: mathPlansOfStudy, 
  catalogYear: 2018, 
  name: 'math', 
  majorId: 'science/mathematics/mathematics-bs' 
}).then((result) => { logSuccess(result) });

const csPlansOfStudy = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'plans-2018-purecs.json')));
const csRequirements = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'COMPUTER\ SCIENCE,\ BSCS.txt')));

MajorData.create({ 
  requirements: csRequirements, 
  plansOfStudy: csPlansOfStudy, 
  catalogYear: 2018, 
  name: 'purecs', 
  majorId: 'computer-information-science/computer-science/bscs' 
}).then((result) => { logSuccess(result) });
