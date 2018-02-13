/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import path from 'path';
import fs from 'fs-extra';

import ellucianSubjectParser from '../ellucianSubjectParser';


it('should work', async (done) => {
  const body = await fs.readFile(path.join(__dirname, 'data', 'ellucianSubjectParser', '1.html'), 'utf8');

  const url = 'https://bannerweb.upstate.edu/isis/bwckgens.p_proc_term_date';

  expect(true).toBe(ellucianSubjectParser.supportsPage(url));

  const output = ellucianSubjectParser.parse(body, url);

  expect(output.length).toBe(27);

  expect(output[0].value).toEqual({
    subject: 'ANAT',
    text: 'Anatomy CM',
  });

  done();
});


// expect(3)
// expect().toBe(ellucianSubjectParser)


// console.log(pageData.deps)
// assert.deepEqual(pageData.dbData,{ url: 'https://bannerweb.upstate.edu/isis/bwckgens.p_proc_term_date',
//  subjects:
//  [ { id: 'ANAT', text: 'Anatomy CM' },
//  { id: 'ANES', text: 'Anesthesiology CM' },
//  { id: 'CBHX', text: 'Bioethics and Humanities' },
//  { id: 'CCFM', text: 'Consortium - Culture/Medicine' },
//  { id: 'EMED', text: 'Emergency Medicine CM&HP' },
//  { id: 'FAMP', text: 'Family Medicine CM' },
//  { id: 'GERI', text: 'Geriatrics CM' },
//  { id: 'INTD', text: 'Interdepartmental CM&HP' },
//  { id: 'INTL', text: 'International Experience' },
//  { id: 'MDCN', text: 'Medicine CM' },
//  { id: 'MICB', text: 'Microbiology CM' },
//  { id: 'M', text: 'Microbiology and Immunology GS' }, //ellucianSubjectParser is same as html
//  { id: 'NEUR', text: 'Neurology CM' },
//  { id: 'NSUG', text: 'Neurosurgery CM' },
//  { id: 'OBGY', text: 'Obstetrics and Gynecology CM' },
//  { id: 'OPTH', text: 'Opthalmology CM' },
//  { id: 'ORTH', text: 'Orthopaedic Surgery CM' },
//  { id: 'OTOL', text: 'Otolaryngology CM' },
//  { id: 'PATH', text: 'Pathology CM&HP' },
//  { id: 'PEDS', text: 'Pediatrics CM' },
//  { id: 'RMED', text: 'Physical Med/Rehabilitation CM' },
//  { id: 'PRVM', text: 'Preventive Medicine' },
//  { id: 'PYCH', text: 'Psychiatry CM' },
//  { id: 'RONC', text: 'Radiation Oncology CM' },
//  { id: 'RADL', text: 'Radiology CM' },
//  { id: 'SURG', text: 'Surgery CM' },
//  { id: 'UROL', text: 'Urology CM' } ],
//  termId: '201510',
//  host: 'upstate.edu' });

// //
