// TODO: merge the data from outputFromOtherParsers with the output from this parser.
// every class from every term
const mergedOutput = {
  colleges: [
    {
      host: 'neu.edu',
      title: 'Northeastern University',
      url: 'neu.edu',
    },
  ],
  terms: [
    {
      termId: '201960',
      text: 'Summer 2 2019',
      host: 'neu.edu',
    },
  ],
  subjects: [
    {
      subject: 'TCC',
      text: 'Technical Communic - CPS',
      termId: '201925',
      host: 'neu.edu/cps',
    },
  ],
  classes: [
    {
      crns: [],
      classAttributes: [
        'No Course Evaluation',
        'CPS-Professional Programs GR 2',
      ],
      desc: 'Focuses on in-depth project in which a student conducts research or produces a product related to the student’s major field. May be repeated without limit. 1.000 TO 4.000 Lecture hours',
      classId: '7995',
      prettyUrl: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201925&subj_code_in=TCC&crse_numb_in=7995',
      name: 'Project',
      url: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201925&subj_in=TCC&crse_in=7995&schd_in=%',
      lastUpdateTime: 1554252001221,
      maxCredits: 4,
      minCredits: 1,
      termId: '201925',
      host: 'neu.edu/cps',
      subject: 'TCC',
    },
    {
      crns: [
        '30392',
        '30393',
        '34764',
      ],
      classAttributes: [
        'NUpath Natural/Designed World',
        'UG College of Science',
      ],
      prereqs: {
        type: 'or',
        values: [
          {
            classId: '1145',
            subject: 'PHYS',
          },
          {
            classId: '1149',
            subject: 'PHYS',
          },
          {
            classId: '1151',
            subject: 'PHYS',
          },
          {
            classId: '1161',
            subject: 'PHYS',
          },
          {
            classId: '1171',
            subject: 'PHYS',
          },
        ],
      },
      coreqs: {
        type: 'and',
        values: [
          {
            classId: '1148',
            subject: 'PHYS',
          },
        ],
      },
      maxCredits: 4,
      minCredits: 4,
      desc: 'Continues PHYS 1145. Covers heat, electricity, vibrations and waves, sound, geometrical optics, and nuclear physics and radioactivity. The application of physics to a variety of problems in the life and health sciences is emphasized. Electricity topics include electrostatics, capacitance, resistivity, direct-current circuits, and RC circuits. Vibrations and waves topics include simple harmonic motion and wave motion. Sound topics include wave characteristics, the ear, Doppler effect, shock waves, and ultrasound. Optics topics include reflection, mirrors, refraction, total internal reflection, fiber optics, lenses, the eye, telescopes, and microscopes. Nuclear physics and radioactivity topics include atomic nucleus, radioactivity, half-life, radioactive dating, detectors, nuclear reaction, fission, fusion, radiation damage, radiation therapy, PET, and MRI. A laboratory is included. 4.000 Lecture hours',
      classId: '1147',
      prettyUrl: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201930&subj_code_in=PHYS&crse_numb_in=1147',
      name: 'Physics for Life Sciences 2',
      url: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201930&subj_in=PHYS&crse_in=1147&schd_in=%',
      lastUpdateTime: 1554252009829,
      termId: '201930',
      host: 'neu.edu',
      subject: 'PHYS',
    },
    {
      crns: [],
      classAttributes: [
        'GS College of Science',
      ],
      desc: 'Discusses the synthesis and analysis of polymer materials. Covers mechanisms and kinetics of condensation/chain-growth polymerization reactions and strategies leading to well-defined polymer architectures and compositions, including living polymerizations (free radical, cationic, anionic), catalytic approaches, and postpolymerization functionalization. Discusses correlation of chemical composition and structure to physical properties and applications. 3.000 Lecture hours',
      classId: '5610',
      prettyUrl: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=201960&subj_code_in=CHEM&crse_numb_in=5610',
      name: 'Polymer Chemistry',
      url: 'https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=201960&subj_in=CHEM&crse_in=5610&schd_in=%',
      lastUpdateTime: 1554252001040,
      maxCredits: 3,
      minCredits: 3,
      prereqs: {
        type: 'or',
        values: [
          {
            type: 'and',
            values: [
              {
                type: 'or',
                values: [
                  {
                    classId: '2317',
                    subject: 'CHEM',
                  },
                  {
                    classId: '2313',
                    subject: 'CHEM',
                  },
                ],
              },
              {
                type: 'or',
                values: [
                  {
                    classId: '3401',
                    subject: 'CHEM',
                  },
                  {
                    classId: '3421',
                    subject: 'CHEM',
                  },
                  {
                    classId: '3431',
                    subject: 'CHEM',
                  },
                ],
              },
            ],
          },
          'Graduate Admission REQ',
        ],
      },
      termId: '201960',
      host: 'neu.edu',
      subject: 'CHEM',
    },
  ],
  sections: [
    {
      seatsCapacity: 25,
      seatsRemaining: 3,
      waitCapacity: 99,
      waitRemaining: 99,
      online: false,
      honors: false,
      url: 'https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201930&crn_in=30020',
      crn: '30020',
      meetings: [
        {
          startDate: 17903,
          endDate: 18003,
          profs: [
            'Deborah Milbauer',
          ],
          where: 'Ryder Hall 247',
          type: 'Class',
          times: {
            2: [
              {
                start: 42300,
                end: 48300,
              },
            ],
          },
        },
        {
          startDate: 17903,
          endDate: 18003,
          profs: [
            'Deborah Milbauer',
          ],
          where: 'Ryder Hall 247',
          type: 'Class',
          times: {
            4: [
              {
                start: 53400,
                end: 59400,
              },
            ],
          },
        },
        {
          startDate: 18005,
          endDate: 18005,
          profs: [
            'Deborah Milbauer',
          ],
          where: 'TBA',
          type: 'Final Exam',
          times: {
            5: [
              {
                start: 37800,
                end: 45000,
              },
            ],
          },
        },
      ],
      lastUpdateTime: 1554252009569,
      termId: '201930',
      host: 'neu.edu',
      subject: 'PHTH',
      classId: '2350',
    },
  ],
};
