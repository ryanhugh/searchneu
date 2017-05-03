import elasticlunr from 'elasticlunr';
import path from 'path';
import mkdirp from 'mkdirp-promise';
import fs from 'fs-promise';
var queue = require('d3-queue').queue

import pageDataMgr from './pageDataMgr';
import macros from '../macros';
import Keys from '../../common/Keys';



const getSearchIndex = '/getSearchIndex'

class Main {
  
  
  async createDataDumps(termDump) {
    
    let termMapDump = {}
    
    
    for (let aClass of termDump.classes) {
      let hash = Keys.create(aClass).getHash()
      
			let termHash = Keys.create({
				host: aClass.host,
				termId: aClass.termId
			}).getHash()

      if (!termMapDump[termHash]) {
        termMapDump[termHash] = {
          classes: {},
          sections: {},
          subjects: {},
          termId: aClass.termId,
          host: aClass.host
        }
      } 

      termMapDump[termHash].classes[hash] = aClass
    }
    
    for (let subject of termDump.subjects) {
      let hash = Keys.create(subject).getHash()
      
			let termHash = Keys.create({
				host: subject.host,
				termId: subject.termId
			}).getHash()

      if (!termMapDump[termHash]) {
        console.log('Found subject with no class?')
        termMapDump[termHash] = {
          classes: {},
          sections: {},
          subjects: {},
          termId: subject.termId,
          host: subject.host
        }
      } 

      termMapDump[termHash].subjects[hash] = subject
    }
    
    for (let section of termDump.sections) {
      let hash = Keys.create(section).getHash()
       
			let termHash = Keys.create({
				host: section.host,
				termId: section.termId
			}).getHash()

      if (!termMapDump[termHash]) {
        console.log("Found section with no class?");
        termMapDump[termHash] = {
          classes: {},
          sections: {},
          subjects: {},
          termId: section.termId,
          host: section.host
        }
      } 

      termMapDump[termHash].sections[hash] = section
    }
    
    
    for (let termHash in termMapDump) {
      // Put them in a different file
      if (!termHash.host || !termHash.termId) {
        console.log(termHash)
      }
      const folderPath = path.join(macros.PUBLIC_DIR, 'getTermDump', termMapDump[termHash].host)
      await mkdirp(folderPath)
      const filePath = path.join(folderPath, termMapDump[termHash].termId);
      console.log(filePath, folderPath)
      await fs.writeFile(filePath, JSON.stringify(termMapDump[termHash]));
    }
    
  }
  
  
  createSerchIndex(termDump) {
    
    let errorCount = 0;
    
		var classLists = {};

		termDump.classes.forEach(function (aClass) {

			var termHash = Keys.create({
				host: aClass.host,
				termId: aClass.termId
			}).getHash()

			var classHash = Keys.create(aClass).getHash()

			if (!classLists[termHash]) {
				classLists[termHash] = {
					classHash: {},
					host: aClass.host,
					termId: aClass.termId
				}
			}

			classLists[termHash].classHash[classHash] = {
				class: aClass,
				sections: []
			}
		}.bind(this));


		termDump.sections.forEach(function (section) {

			var termHash = Keys.create({
				host: section.host,
				termId: section.termId
			}).getHash()

			var classHash = Keys.create({
				host: section.host,
				termId: section.termId,
				subject: section.subject,
				classUid: section.classUid,
			}).getHash()


			if (!classLists[termHash]) {
				// The objects should all have been created when looping over the classes. 
				elog('dont have obj in section for loop?', termHash, classHash, section)
				errorCount++;
				return;
			}

			if (!classLists[termHash].classHash[classHash]) {
				elog('no class exists with same data?', classHash, section.url)
				errorCount++;
				return;
			}

			classLists[termHash].classHash[classHash].sections.push(section)
		}.bind(this))


		var q = queue(1);

		for (var attrName in classLists) {
			q.defer(function (attrName, callback) {

				var termData = classLists[attrName]
				var keys = Keys.create(termData)

				var index = elasticlunr();

				index.saveDocument(false)

				index.setRef('key');
				index.addField('desc');
				index.addField('name');
				index.addField('classId');
				index.addField('subject');
				index.addField('profs');
				index.addField('locations');
				index.addField('crns')

				for (var attrName2 in termData.classHash) {
					var searchResultData = termData.classHash[attrName2];

					var toIndex = {
						classId: searchResultData.class.classId,
						desc: searchResultData.class.desc,
						subject: searchResultData.class.subject,
						name: searchResultData.class.name,
						key: Keys.create(searchResultData.class).getHash(),
					}

					var profs = [];
					var locations = [];
					searchResultData.sections.forEach(function (section) {
						if (section.meetings) {
							section.meetings.forEach(function (meeting) {
								if (meeting.profs) {
									profs = profs.concat(meeting.profs)
								}
								if (meeting.where) {
									locations.push(meeting.where)
								}
							}.bind(this))
						}
					}.bind(this))


					toIndex.profs = profs.join(' ')
					toIndex.locations = locations.join(' ')
					if (searchResultData.class.crns) {
						toIndex.crns = searchResultData.class.crns.join(' ')
					}
					index.addDoc(toIndex)
				}

				var searchIndexString = JSON.stringify(index.toJSON());

				var fileName = path.join(macros.PUBLIC_DIR, keys.getHashWithEndpoint(getSearchIndex));
				var folderName = path.dirname(fileName);

				mkdirp(folderName, function (err) {
					if (err) {
						return callback(err);
					}

					fs.writeFile(fileName, searchIndexString, function (err) {
						if (err) {
							return callback(err);
						}

						console.log("Successfully saved", fileName, 'errorCount:', errorCount);

						classLists[attrName] = null

						return callback()
					}.bind(this));
				}.bind(this));
			}.bind(this, attrName))
		}

    return new Promise(function (resolve, reject) {
      q.awaitAll(function (err) {
        if (err) {
          reject(err)
        }
        else {
    			resolve()
        }
  		}.bind(this))  
    })
  }
  
  
  
  
  async main (hostnames) {
    if (!hostnames) {
      console.error("Need hostnames for scraping classes")
      return null;
    }
    
    let termDump = await pageDataMgr.main(hostnames)
    console.log(termDump)
    console.log('HI', !!termDump)
    await this.createSerchIndex(termDump)
    await this.createDataDumps(termDump)
    
    
    
    // Make the search index
    
    
  }
  
  
  
}

const instance = new Main()


if (require.main === module) {
  instance.main(['presby'])
  
}

export default instance;