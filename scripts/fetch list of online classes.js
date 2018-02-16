import Keys from '../common/Keys';
import path from 'path';
import fs from 'fs-extra';
import request from 'request-promise-native';
import macros from '../backend/macros'


// Used for loading the data required to make the frontend work.
// This is just the data stored in public and not in cache.
// Tries to load from a local file and if that fails loads from https://searchneu.com
// And caches that locally.
async function getFrontendData(file) {
  const localPath = path.join(macros.PUBLIC_DIR, file);
  const exists = await fs.exists(localPath);

  // Exists locally, great
  if (exists) {
    const body = await fs.readFile(localPath);
    return JSON.parse(body);
  }

  macros.log('Downloading ', file, ' from searchneu.com becaues it does not exist locally.');

  // Download from https://searchneu.com
  // Note this goes through the local request cache
  let resp;
  try {
    resp = await request.get(`https://searchneu.com/data/v${macros.schemaVersion}/${file}`);
  } catch (e) {
    macros.error('Unable to load frontend data from locally or from searchneu.com!', file, e);
    return null;
  }

  await mkdirp(path.dirname(localPath));

  let data;

  try {
    data = JSON.parse(resp.body);
  } catch (e) {
    macros.log('Could not download term', file, 'from server!');
    macros.log('Probably going to crash');
    return null;
  }

  // Save that locally
  await fs.writeFile(localPath, resp.body);

  return data;
}


// https://gist.github.com/ryanhugh/c4eee5d6dbb1fa7294c24f309e7f00e6

// https://searchneu.com/data/v2/getTermDump/neu.edu/201830.json


function findOnlineClasses(termDump) {

  let onlineClasses = {}

  for (let section of Object.values(termDump.sectionMap)) {

    if (section.online) {
      let hash = Keys.create({
        host: section.host,
        termId: section.termId,
        subject: section.subject,
        classId: section.classId
      }).getHash()


      onlineClasses[hash] = true;
    }
  }


  let classes = []


  for (let hash of Object.keys(onlineClasses)) {

    let aClass = termDump.classMap[hash]
    classes.push(aClass)
  }


  classes.sort(function (a, b) {
    let aNum = parseInt(a.classId)
    let bNum = parseInt(b.classId)
    if (aNum < bNum) {
      return -1
    }
    else if (aNum > bNum) {
      return 1
    }
    else {
      return 0;
    }
  })  

  for (let aClass of classes) {
    console.log('['+aClass.subject+' '+aClass.classId+'](https://searchneu.com/'+aClass.subject+aClass.classId+') ' + aClass.name)
  }

}



async function main() {

  // summer i
  let one = await getFrontendData('getTermDump/neu.edu/201840.json');

  // summer ii
  let two = await getFrontendData('getTermDump/neu.edu/201860.json');

  // summer full
  let full = await getFrontendData('getTermDump/neu.edu/201850.json');



  findOnlineClasses(one)
  
}


main()



201840