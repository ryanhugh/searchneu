/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

const neuData = `${'database contains ONLY .EDU domains. \n'
  + 'The data in the EDUCAUSE Whois database is provided \n'
  + 'by EDUCAUSE for information purposes in order to \n'
  + 'assist in the process of obtaining information about \n'
  + 'or related to .edu domain registration records. \n'
  + '\n'
  + 'The EDUCAUSE Whois database is authoritative for the \n'
  + '.EDU domain.         \n'
  + '\n'
  + 'A Web interface for the .EDU EDUCAUSE Whois Server is \n'
  + 'available at: http://whois.educause.net \n'
  + '\n'
  + 'By submitting a Whois query, you agree that this information \n'
  + 'will not be used to allow, enable, or otherwise support \n'
  + 'the transmission of unsolicited commercial advertising or \n'
  + 'solicitations via e-mail.  The use of electronic processes to \n'
  + 'harvest information from this server is generally prohibited \n'
  + 'except as reasonably necessary to register or modify .edu \n'
  + 'domain names.\n'
  + '\n'}`
  + `${'You may use ' % ' as a wildcard in your search. For further \n'}`
  + 'information regarding the use of this WHOIS server, please \n'
  + 'type: help \n'
  + '\n'
  + '--------------------------\n'
  + '\n'
  + 'Domain Name: NEU.EDU\n'
  + '\n'
  + 'Registrant:\n'
  + '   Northeastern University\n'
  + '   360 Huntington Avenue\n'
  + '   25 Richards Hall\n'
  + '   Boston, MA 02115\n'
  + '   UNITED STATES\n'
  + '\n'
  + 'Administrative Contact:\n'
  + '   Robert Whelan\n'
  + '   netserv\n'
  + '   Northeastern University, Network Services\n'
  + '   360 Huntington Ave.\n'
  + '   25 Richards Hall\n'
  + '   Boston, MA 02115\n'
  + '   UNITED STATES\n'
  + '   (617) 373-4282\n'
  + '   netserv@neu.edu\n'
  + '\n'
  + 'Technical Contact:\n'
  + '   Robert Whelan\n'
  + '   netserv\n'
  + '   Northeastern University, Network Services\n'
  + '   360 Huntington Ave.\n'
  + '   25 Richards Hall\n'
  + '   Boston, MA 02115\n'
  + '   UNITED STATES\n'
  + '   (617) 373-4282\n'
  + '   netserv@neu.edu\n'
  + '\n'
  + 'Name Servers: \n'
  + '   NB4276.NEU.EDU                155.33.16.201\n'
  + '   NB4277.NEU.EDU                155.33.16.202\n'
  + '   NS20.CUSTOMER.LEVEL3.NET      \n'
  + '   NS29.CUSTOMER.LEVEL3.NET      \n'
  + '\n'
  + 'Domain record activated:    24-Mar-1993\n'
  + 'Domain record last updated: 31-May-2011\n'
  + 'Domain expires:             31-Jul-2016\n';


class MockWhois {
  constructor() {
    this.tryCount = {};
  }


  lookup(host, callback) {
    // The whois lookup fails a lot, so lets test the retry logic by having it fail for the first time here.
    if (!this.tryCount[host]) {
      this.tryCount[host] = 1;
      return callback('lololol');
    }


    if (host === 'neu.edu') {
      return callback(null, neuData);
    }

    return callback('dont have data for anything other thatn neu!!');
  }
}
export default new MockWhois();
