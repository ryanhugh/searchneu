import fs from 'fs-promise';
import _ from 'lodash';
import URI from 'urijs';

import cache from '../cache';
import macros from '../../macros';
import Keys from '../../../common/Keys';
import searchIndex from './searchIndex';
import termDump from './termDump';
import differentCollegeUrls from './differentCollegeUrls';

// Processors
import addClassUids from './processors/addClassUids';
import prereqClassUids from './processors/prereqClassUids';
import termStartEndDate from './processors/termStartEndDate';
import simplifyProfList from './processors/simplifyProfList';

// Parsers
import collegeNamesParser from './parsers/collegeNamesParser';
import ellucianTermsParser from './parsers/ellucianTermsParser';


// This is the main entry point for scraping classes
// call the main(['neu']) function below to scrape a college
// This file also generates the search index and data dumps.


class Main {

  waterfallIdentifyers(rootNode, attrToAdd = {}) {
    const newChildAttr = {};

    // Shallow clone the attributes to newChildAttr.
    // Would use Object.create, but this puts the inhereted attributes on the prototype and JSON.stringify does not include properties on the prototype.
    for (const attrName of Object.keys(attrToAdd)) {
      newChildAttr[attrName] = attrToAdd[attrName];
    }

    // Sanity check to make sure this node is valid.
    if (!rootNode.value || !rootNode.type) {
      macros.error('Invalid root node', rootNode);
      return;
    }

    // Look at this object and find any new attributes that should be copied over to children.
    // Eg If so far we have a host, termId and a subject, and this is a class, a classId will be added to the newChildAttr object
    // and will be carried down to all the children with the host, termId and subject
    for (const attrName of Object.keys(rootNode.value)) {
      if (!Keys.allKeys.includes(attrName) && attrName !== 'classId') {
        continue;
      }

      // Make sure that the child object does not have a different value that would be overriden by adding all
      // the properties from attrToAdd
      if (rootNode.value[attrName] && newChildAttr[attrName] && rootNode.value[attrName] !== newChildAttr[attrName]) {
        macros.error('Overriding attr?', attrName, rootNode.value, newChildAttr);
      }

      newChildAttr[attrName] = rootNode.value[attrName];
    }

    // Actually add the atributes to this obj
    rootNode.value = Object.assign({}, rootNode.value, newChildAttr);

    // Recusion.
    if (rootNode.deps) {
      for (const dep of rootNode.deps) {
        this.waterfallIdentifyers(dep, newChildAttr);
      }
    }
  }


  // Converts the PageData data structure to a term dump. Term dump has a .classes and a .sections, etc, and is used in the processors
  pageDataStructureToTermDump(rootNode) {
    const output = {};

    let stack = [rootNode];
    let curr = null;
    while ((curr = stack.pop())) {
      if (!curr.type) {
        macros.error('no type?', curr);
        continue;
      }

      if (!output[curr.type]) {
        output[curr.type] = [];
      }

      const item = {};

      Object.assign(item, curr.value);

      output[curr.type].push(item);


      if (curr.deps) {
        stack = stack.concat(curr.deps);
      }
    }

    return output;
  }


  getUrlsFromCollegeAbbrs(collegeAbbrs) {
    // This list is modified below, so clone it here so we don't modify the input object.
    collegeAbbrs = collegeAbbrs.slice(0);

    if (collegeAbbrs.length > 1) {
      // Need to check the processors... idk
      macros.error('Unsure if can do more than one abbr at at time. Exiting. ');
      return null;
    }


    const urlsToProcess = [];

    differentCollegeUrls.forEach((url) => {
      const urlParsed = new URI(url);

      let primaryHost = urlParsed.hostname().slice(urlParsed.subdomain().length);

      if (primaryHost.startsWith('.')) {
        primaryHost = primaryHost.slice(1);
      }

      primaryHost = primaryHost.split('.')[0];


      if (collegeAbbrs.includes(primaryHost)) {
        _.pull(collegeAbbrs, primaryHost);

        urlsToProcess.push(url);
      }
    });

    macros.log('Processing ', urlsToProcess);
    return urlsToProcess;
  }


  async main(collegeAbbrs) {
    if (!collegeAbbrs) {
      macros.error('Need collegeAbbrs for scraping classes');
      return null;
    }

    const cacheKey = collegeAbbrs.join(',');

    // if this is dev and this data is already scraped, just return the data
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get('dev_data', 'classes', cacheKey);
      if (devData) {
        return devData;
      }
    }


    const urls = this.getUrlsFromCollegeAbbrs(collegeAbbrs);
    if (urls.length > 1) {
      macros.error('Unsure if can do more than one abbr at at time. Exiting. ');
      return null;
    }

    const url = urls[0];


    // Find the name of the college (neu.edu -> Northeastern University)
    // This is the first of the efforts to rewrite the old es5 code to es6,
    // and remove a lot of the uncessecary logic
    const host = macros.getBaseHost(url);
    const collegeNamePromise = collegeNamesParser.main(host);


    const parsersOutput = await ellucianTermsParser.main(url);

    const rootNode = {
      type: 'colleges',
      value: {},
      deps: parsersOutput,
    };

    this.waterfallIdentifyers(rootNode);

    await fs.writeFile('out.log', JSON.stringify(rootNode, null, 4));
    macros.log('out.log saved');


    const dump = this.pageDataStructureToTermDump(rootNode);

    // Add the data that was calculatd here
    if (!dump.colleges) {
      dump.colleges = [];
    }
    dump.colleges.push({
      host: host,
      title: await collegeNamePromise,
      url: host,
    });


    // Run the processors, sequentially
    addClassUids.go(dump);
    prereqClassUids.go(dump);
    termStartEndDate.go(dump);

    // Add new processors here.
    simplifyProfList.go(dump);


    await searchIndex.main(dump);
    await termDump.main(dump);


    if (macros.DEV) {
      await cache.set('dev_data', 'classes', cacheKey, dump);
      macros.log('classes file saved for', collegeAbbrs, '!');
    }

    return dump;
  }
}

const instance = new Main();

if (require.main === module) {
  instance.main(['gwu']);
}

export default instance;
