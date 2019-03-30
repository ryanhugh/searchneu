/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import _ from 'lodash';
import URI from 'urijs';

import cache from '../cache';
import macros from '../../macros';
import Keys from '../../../common/Keys';
import searchIndex from './searchIndex';
import termDump from './termDump';
import differentCollegeUrls from './differentCollegeUrls';
import bannerv9CollegeUrls from './bannerv9CollegeUrls';

// Processors
import markMissingPrereqs from './processors/markMissingPrereqs';
import termStartEndDate from './processors/termStartEndDate';
import simplifyProfList from './processors/simplifyProfList';
import addPreRequisiteFor from './processors/addPreRequisiteFor';

// Parsers
import collegeNamesParser from './parsers/collegeNamesParser';
import ellucianTermsParser from './parsers/ellucianTermsParser';
import bannerv9Parser from './parsersxe/bannerv9Parser';


// This is the main entry point for scraping classes
// This file calls into the first Banner v8 parser, the processors, and hopefully soon, the v9 parsers too.
// Call the main(['neu']) function below to scrape a college
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

      // If the type is set to ignore, don't add it to the output, but do process this items deps
      if (curr.type !== 'ignore') {
        if (!output[curr.type]) {
          output[curr.type] = [];
        }

        const item = {};

        Object.assign(item, curr.value);

        output[curr.type].push(item);
      }


      if (curr.deps) {
        stack = stack.concat(curr.deps);
      }
    }

    return output;
  }


  getUrlsFromCollegeAbbrs(collegeAbbrs, listToCheck) {
    // This list is modified below, so clone it here so we don't modify the input object.
    collegeAbbrs = collegeAbbrs.slice(0);

    if (collegeAbbrs.length > 1) {
      // Need to check the processors... idk
      macros.error('Unsure if can do more than one abbr at at time. Exiting. ');
      return null;
    }


    const urlsToProcess = [];

    listToCheck.forEach((url) => {
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

  // Converts the data structure used for parsing into the data structure used in the processors.
  restructureData(rootNode) {
    this.waterfallIdentifyers(rootNode);
    return this.pageDataStructureToTermDump(rootNode);
  }

  // Runs the processors over a termDump.
  // The input of this function should be the output of restructureData, above.
  // The updater.js calls into this function to run the processors over the data scraped as part of the processors.
  runProcessors(dump) {
    // Run the processors, sequentially
    markMissingPrereqs.go(dump);
    termStartEndDate.go(dump);

    // Add new processors here.
    simplifyProfList.go(dump);
    addPreRequisiteFor.go(dump);

    return dump;
  }


  async main(collegeAbbrs) {
    if (!collegeAbbrs) {
      macros.error('Need collegeAbbrs for scraping classes');
      return null;
    }

    const cacheKey = collegeAbbrs.join(',');

    // if this is dev and this data is already scraped, just return the data
    if (macros.DEV && require.main !== module) {
      const devData = await cache.get(macros.DEV_DATA_DIR, 'classes', cacheKey);
      if (devData) {
        return devData;
      }
    }


    const bannerv8Urls = this.getUrlsFromCollegeAbbrs(collegeAbbrs, differentCollegeUrls);
    if (bannerv8Urls.length > 1) {
      macros.error('Unsure if can do more than one abbr at at time. Exiting. ');
      return null;
    }

    const bannerv9Urls = this.getUrlsFromCollegeAbbrs(collegeAbbrs, bannerv9CollegeUrls);
    if (bannerv9Urls.length > 1) {
      macros.error('Unsure if can do more than one abbr at at time. Exiting. ');
      return null;
    }


    const bannerv8Url = bannerv8Urls[0];
    const bannerv9Url = bannerv9Urls[0];


    // Find the name of the college (neu.edu -> Northeastern University)
    const host = macros.getBaseHost(bannerv8Url);
    const collegeNamePromise = collegeNamesParser.main(host);

    // Change this when we want to enable the new v9 parser.
    let bannerv9ParserOutputPromise;
    if (false) { // eslint-disable-line no-constant-condition
      bannerv9ParserOutputPromise = bannerv9Parser.main(bannerv9Url);
    } else {
      bannerv9ParserOutputPromise = Promise.resolve({});
    }


    const parsersOutput = await ellucianTermsParser.main(bannerv8Url);

    const bannerv9ParserOutput = await bannerv9ParserOutputPromise;

    const rootNode = {
      type: 'ignore',
      value: {},
      deps: [{
        type: 'ignore',
        value: {},
        deps: parsersOutput,
      },

      // Add the data that was calculated here
      // Don't put this as a parent of the rest of the processors
      // so the host: data from here is not copied to the children
      {
        type: 'colleges',
        value: {
          host: host,
          title: await collegeNamePromise,
          url: host,
        },
        deps: [],
      }],
    };

    const restructuredData = this.restructureData(rootNode);


    // bannerv9ParserOutput and parsersOutput should be the same.
    if (_.isEqual(bannerv9ParserOutput, restructuredData)) {
      macros.log('Parsers output not the same');
    } else {
      macros.log('Parsers output is the same!');
    }


    const dump = this.runProcessors(restructuredData);


    await searchIndex.main(dump);
    await termDump.main(dump);

    if (macros.DEV) {
      await cache.set(macros.DEV_DATA_DIR, 'classes', cacheKey, dump);
      macros.log('classes file saved for', collegeAbbrs, '!');
    }

    return dump;
  }
}

const instance = new Main();

if (require.main === module) {
  // instance.main(['mscc']);
  // instance.main(['uncfsu']);
  instance.main(['neu']);
  // instance.main(['fit']);
}

export default instance;
