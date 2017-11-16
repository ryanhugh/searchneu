/*
 * This file is part of Search NEU and licensed under AGPL3. 
 * See the license file in the root folder for details. 
 */

import cheerio from 'cheerio';
import URI from 'urijs';
import tj from '@mapbox/togeojson';
import DOMParser from 'xmldom';
import path from 'path';

import macros from '../macros';
import request from './request';
import cache from './cache';


// Downloads building data from the interactive Google map of Northeastern Buildings that NEU provides
// Google Maps has a fantastic download option, so this file is pretty small :)
// However, this data source does not have a lot of information on each building
// Example output. 121 buildings are on this link
/* eslint-disable max-len */
// "properties": {
//         "name": "West Village A South",
//         "styleUrl": "#icon-503-DB4436",
//         "styleHash": "3abf6c24",
//         "description": "<img src=\"https://lh6.googleusercontent.com/proxy/FG9MSt3YcIuMEXuSCisC1u98M9IcBVcqc80N2YOp2OVxSDNjwNL2pAS-7RY4dIXOLrCuxFAjQuZ04LItPoBPq3KGz9TGL9LreZvdloVqXtTI24RnvSdtPG05UQ8\" height=\"200\" width=\"auto\" /><br><br>42.33671: 42.3372592<br>-71.08623: -71.0932206<br>Residence Hall: Residence Hall<br>About:: With distinctive curved facades, vaulted archways, and high-rise towers that provide spectacular views of Boston, the West Village residence halls are among the most popular living options for upperclass students.<br>Read more: : http://www.northeastern.edu/reslife/",
//         "42.33671": "42.3372592",
//         "-71.08623": "-71.0932206",
//         "Residence Hall": "Residence Hall",
//         "About:": "With distinctive curved facades, vaulted archways, and high-rise towers that provide spectacular views of Boston, the West Village residence halls are among the most popular living options for upperclass students.",
//         "Read more: ": "http://www.northeastern.edu/reslife/",
//         "gx_media_links": "https://lh6.googleusercontent.com/proxy/FG9MSt3YcIuMEXuSCisC1u98M9IcBVcqc80N2YOp2OVxSDNjwNL2pAS-7RY4dIXOLrCuxFAjQuZ04LItPoBPq3KGz9TGL9LreZvdloVqXtTI24RnvSdtPG05UQ8"
//     }
// },

/* eslint-enable max-len */
// www.northeastern.edu/neuhome/about/maps.html

// This site has info on classrooms
// https://classroom.neu.edu/


// Floor plans of dorms can be found here
// https://rms.neu.edu/images/custom/Sopfloorplan2014.html


// More info here on Dorms, eg a better description and which LLCs are in which dorm
// https://www.northeastern.edu/housing/residences/


// Info we want for each building
// Name (eg Smith Hall)
// Address (eg 50 Leon Street)
// Photos url
// Url to reslife page
// description
// floorplan (if building is a dorm)
// picture of classrooms (if the building is a classroom)
// photos of outside of building
// which LLCs are in the building (is on the reslife link)
// amenities? has AC? has heat? has kitchen/bathroom or is a studio, etc. has living room?
// cost per semester??? If this is internal only maybe pass for now


async function main() {
  const resp = await request.get('http://www.northeastern.edu/neuhome/about/maps.html');

  const $ = cheerio.load(resp.body);

  const googleMapSrc = $('#campus-map > iframe').attr('src');

  const mid = new URI(googleMapSrc).query(true).mid;

  const kmlRequest = await request.get(`https://www.google.com/maps/d/u/0/kml?forcekml=1&mid=${mid}`);

  const json = tj.kml(new DOMParser.DOMParser().parseFromString(kmlRequest.body));

  console.log(json.features);

  const outputFile = path.join(macros.DEV_DATA_DIR, 'buildings.json');

  if (macros.DEV) {
    await cache.set('dev_data', 'buildings', 'main', json.features)
    console.log('buildings file saved!');
  }


  // await Promise.all(promises);

  // const outputPath = path.join(macros.PUBLIC_DIR, 'getClubs', 'neu.edu');

  // await mkdirp(outputPath);

  // await fs.writeFile(path.join(outputPath, 'data.json'), JSON.stringify(orgs));
  // console.log('done!', orgs.length);
}

if (require.main === module) {
  main();
}


// www.northeastern.edu/neuhome/about/maps.html
