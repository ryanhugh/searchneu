/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import URI from 'urijs';
import macros from '../macros';

// This file mocks out request.js
// Provides stubs for all the methods.



let searchExample = {
    "results": [
        {
            "score": 4.009930822280515,
            "type": "class",
            "class": {
                "crns": [],
                "classAttributes": [
                    "GS Col of Arts",
                    "Media & Design"
                ],
                "maxCredits": 4,
                "minCredits": 4,
                "desc": "Examines time-tested and cutting-edge methods for shaping and presenting messages across multimedia platforms to effectively disseminate an organization’s message, change a public conversation, or shift public opinion. Examines case studies in mainstream media, public advocacy, and strategic communications to explore the motivations and methods of the organizations as well as the tools and techniques used. Examines the practice of digital advocacy by exploring and applying pertinent findings from politics, advertising, and behavioral science that are increasingly employed by professionals looking to “micro-target” voters, “convert” customers, or “nudge” the public. One major component of the course is hands-on workshops through which students are offered an opportunity to learn how to leverage the latest digital tools for communicating across social media and online platforms. 4.000 Lecture hours",
                "classId": "5400",
                "prettyUrl": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=202010&subj_code_in=JRNL&crse_numb_in=5400",
                "name": "Media and Advocacy in Theory and Practice",
                "url": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=202010&subj_in=JRNL&crse_in=5400&schd_in=%",
                "lastUpdateTime": 1565626142874,
                "termId": "202010",
                "host": "neu.edu",
                "subject": "JRNL",
                "optPrereqsFor": {
                    "values": []
                },
                "prereqsFor": {
                    "values": []
                }
            },
            "sections": []
        },
        {
            "score": 3.2079446578244117,
            "type": "class",
            "class": {
                "crns": [],
                "classAttributes": [
                    "NUpath Analyzing/Using Data",
                    "Engineering"
                ],
                "prereqs": {},
                "coreqs": {},
                "maxCredits": 4,
                "minCredits": 4,
                "desc": "Introduces basic measurements and data analysis techniques. Offers students an opportunity to become familiar with various types of measurement systems and to set up and perform experiments according to a given procedure. Covers basic measurement methods of rotational frequency; temperature, pressure, and power; and analog-to-digital conversion techniques and data acquisition. Data analysis topics include statistical analysis of data, probability and inherent uncertainty, basic measurement techniques, primary and secondary standards, system response characteristics, and computerized data acquisition methods. Includes experiments in thermodynamics, fluid mechanics, and heat transfer. Topics include cycle performance, flow discharge coefficient and heat transfer coefficient measurements, and psychometric applications in the air-conditioning field. 4.000 Lecture hours",
                "classId": "4505",
                "prettyUrl": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=202010&subj_code_in=ME&crse_numb_in=4505",
                "name": "Measurement and Analysis with Thermal Science Application",
                "url": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=202010&subj_in=ME&crse_in=4505&schd_in=%",
                "lastUpdateTime": 1565626142878,
                "termId": "202010",
                "host": "neu.edu",
                "subject": "ME",
                "optPrereqsFor": {
                    "values": []
                },
                "prereqsFor": {
                    "values": []
                }
            },
            "sections": []
        },
        {
            "score": 2.1209753532061653,
            "type": "class",
            "class": {
                "crns": [],
                "classAttributes": [
                    "GSEN Engineering"
                ],
                "desc": "Introduces the relatively young field of soft matter, which encompasses the physical description of various states of soft materials including liquids, colloids, polymers, foams, gels, granular materials, and a number of biological materials. Soft matter (also known as “soft condensed matter” or “complex fluids”) is less ordered than metals and oxides (hard condensed matter) and is more subject to thermal fluctuations and applied forces. Focuses on critical thinking, problem diagnosis, estimation, statistical analysis, and data-based decision making. Includes many in-class demonstrations from colloidal assembly to emulsion stability to cellular apoptosis. Highlights applications such as industrial processing, life sciences, and environmental remediation. Requires graduate study in related field or permission of instructor. 4.000 Lecture hours",
                "classId": "6250",
                "prettyUrl": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=202010&subj_code_in=MATL&crse_numb_in=6250",
                "name": "Soft Matter",
                "url": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=202010&subj_in=MATL&crse_in=6250&schd_in=%",
                "lastUpdateTime": 1565626115527,
                "maxCredits": 4,
                "minCredits": 4,
                "termId": "202010",
                "host": "neu.edu",
                "subject": "MATL",
                "optPrereqsFor": {
                    "values": []
                },
                "prereqsFor": {
                    "values": []
                }
            },
            "sections": []
        },
        {
            "score": 1.9514106966879916,
            "type": "class",
            "class": {
                "crns": [
                ],
                "classAttributes": [
                    "GSEN Engineering"
                ],
                "maxCredits": 4,
                "minCredits": 4,
                "desc": "Covers fundamentals of materials thermodynamics that encompass the first, second, and third laws, entropy, enthalpy, and free energy. Emphasis is on phase stability and equilibria, phase diagram computation with applications to phases in metals, alloys, and ionic compounds. Requires knowledge of thermodynamics course and materials science course. 4.000 Lecture hours",
                "classId": "7355",
                "prettyUrl": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=202010&subj_code_in=MATL&crse_numb_in=7355",
                "name": "Thermodynamics of Materials",
                "url": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=202010&subj_in=MATL&crse_in=7355&schd_in=%",
                "lastUpdateTime": 1565626142876,
                "termId": "202010",
                "host": "neu.edu",
                "subject": "MATL",
                "optPrereqsFor": {
                    "values": []
                },
                "prereqsFor": {
                    "values": [
                        {
                            "subject": "MATL",
                            "classId": "7360"
                        }
                    ]
                }
            },
            "sections": []
        },
        {
            "score": 1.88289045341538,
            "type": "class",
            "class": {
                "crns": [
                ],
                "classAttributes": [
                    "GSEN Engineering"
                ],
                "prereqs": {},
                "maxCredits": 4,
                "minCredits": 4,
                "desc": "Covers the processing of metallic and ceramic materials from particulate form. Includes particulate fabrication, characterization, handling, and consolidation for alloys, ceramics, and composites. Other topics include the principles of sintering in the absence and presence of liquid, advanced materials processing by rapid-solidification powder metallurgy, and the processing and structures of advanced ceramics. 4.000 Lecture hours",
                "classId": "5380",
                "prettyUrl": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_course_detail?cat_term_in=202010&subj_code_in=MATL&crse_numb_in=5380",
                "name": "Particulate Materials Processing",
                "url": "https://wl11gp.neu.edu/udcprod8/bwckctlg.p_disp_listcrse?term_in=202010&subj_in=MATL&crse_in=5380&schd_in=%",
                "lastUpdateTime": 1565626142876,
                "termId": "202010",
                "host": "neu.edu",
                "subject": "MATL",
                "optPrereqsFor": {
                    "values": []
                },
                "prereqsFor": {
                    "values": []
                }
            },
            "sections": []
        }
    ],
    "wasSubjectMatch": false
}



class MockRequest {

  constructor() {

    // Keeps track of whether to reply to searches for ben
    this.replyWithDataToBen;

    this.reset();
  }


  // Reset back to defaults
  reset() {
    this.replyWithDataToBen = true;
  }

  // Sets whether this mock should return the data or return an empty array when 
  // 'ben' is searched for. 
  // Only effects searches for 'ben'
  setBenResponse(bool) {
    this.replyWithDataToBen = bool;
  }

  
  async get(request) {

    console.log(request)

    let urlParsed = new URI(request);

    console.log(urlParsed)

    console.log(urlParsed.path() , urlParsed.query(true).query == 'ben' , !this.replyWithDataToBen)

    if (urlParsed.path() == '/search' && urlParsed.query(true).query == 'ben' && !this.replyWithDataToBen) {
      return {
        results: [],
        "wasSubjectMatch": false
      }
    }


    return searchExample;
  }



}


export default new MockRequest();
