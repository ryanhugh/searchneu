/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import fs from 'fs-promise';
import path from 'path';

class SitemapGenerator {
  async go(termDump, mergedEmployees) {
    // Items to link to.
    // The part after the https://searchneu.com/
    const items = [];

    // Add the subjects
    for (const subject of termDump.subjects) {
      if (subject.termId !== '201830') {
        continue;
      }

      items.push(subject.subject);
      items.push(subject.text);
    }

    // Add the classes
    for (const aClass of termDump.classes) {
      if (aClass.termId !== '201830') {
        continue;
      }

      items.push(`${aClass.subject} ${aClass.classId}`);
      items.push(aClass.name);
    }

    // Add the employees
    for (const employee of mergedEmployees) {
      items.push(employee.name);
    }

    // Convert the items to urls and put them inside xml
    const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
    for (const item of items) {
      xml.push('  <url>');
      xml.push(`    <loc>https://searchneu.com/${encodeURIComponent(item)}</loc>`);
      xml.push('  </url>');
    }
    xml.push('</urlset>');

    const output = xml.join('\n');

    await fs.writeFile(path.join('public', 'sitemap.xml'), output);
  }
}


export default new SitemapGenerator();
