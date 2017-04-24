import cheerio from 'cheerio';

import utils from './utils';
import linkSpider from './linkSpider';
import request from './request';


class Cssh {


  getShallowText(elements) {
    const retVal = [];
    elements.forEach((element) => {
      if (element.type !== 'text') {
        return;
      }

      const text = element.data.trim();
      if (text.length > 0) {
        retVal.push(text);
      }
    });
    return retVal;
  }


  parseDetailpage(url, resp) {
    const obj = {};

    obj.url = url;

    const $ = cheerio.load(resp.body);


    obj.name = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single > h1').text().trim();


    obj.image = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single > img.headshot').attr('src').trim();

    // Job Title
    // "Assistant Professor Sociology and Health Science"
    obj.title = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single > div.fac-single-title').text().trim();

    // Parse out the email. Parse both the email it is linked to and the email that is displayed to ensure they are the same
    const emailElements = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single > p > a');

    const mailto = utils.standardizeEmail(emailElements.attr('href')).trim();
    const email = utils.standardizeEmail(emailElements.text().trim()).trim();
    if ((mailto || email) && mailto !== email) {
      console.log('Warning; mailto !== email, skipping', mailto, email, 'done yo');
    } else if (mailto === email && email) {
      obj.email = email;
    }


    // Phone number and office location are just both in a <p> element separated by <br>.
    // Dump all the text and then figure out where the phone and office is.
    const descriptionElements = $('#lightbox-container > div.col-lg-3.col-md-3.col-sm-6.fac-single')[0].children;

    let category = null;
    const address = [];

    descriptionElements.forEach((element) => {

      if (element.type === 'text') {

        
        if (category === null) {
          return;
        }
        if (element.data.trim().length === 0) {
          return;
        }


        if (category === 'Mailing Address') {
          const newText = element.data.trim();
          if (newText) {
            address.push(newText);
          }
        } else if (category === 'Contact:') {
          console.log(element.data.trim(), 'phone??');
        }
      } else if (element.type === 'tag') {
        if (element.name === 'h4') {
          if (element.children.length !== 1 || element.children[0].type !== 'text') {
            console.log('error finding category text', element.children);
          } else {
            const h4Text = element.children[0].data.trim();
            if (h4Text.length > 0) {
              category = h4Text;
            } else {
              console.log('Found h4 with no text?', element.children);
            }
          }
        } else if (element.name === 'br' || element.name === 'script') {
          return;
        }
      } else {
        console.error('!!!', element.type);
      }
    });
    console.log(address, obj);
    process.exit();

    const texts = this.getShallowText(descriptionElements);

    texts.forEach((text) => {
      text = text.trim();
      const possiblePhone = utils.standardizePhone(text);
      if (possiblePhone) {
        if (obj.phone) {
          console.log('duplicate phone??', obj.phone, possiblePhone);
        }

        obj.phone = possiblePhone;

      // Might be office
      } else if (text.length > 6) {
        if (obj.office) {
          console.log('dup office???', obj.office, text);
        }
        if (text.startsWith('Office: ')) {
          text = text.slice('Office: '.length);
        }
        obj.office = text;
      } else {
        console.log('Warn: unknown prop in description', text);
      }
    });

    return obj;
  }


  async main() {
    // console.log('starting ccs')
    // https://www.northeastern.edu/cssh/faculty
    const startingLinks = ['https://www.northeastern.edu/cssh/faculty'];


    const urls = await linkSpider.main(startingLinks);

    let profileUrls = [];

    // Filter all the urls found to just profile urls
    //  'https://www.northeastern.edu/cssh/faculty/noemi-daniel-voionmaa',
    urls.forEach((url) => {
      if (url.match(/https:\/\/www.northeastern.edu\/cssh\/faculty\/[\d\w-]+\/?/i)) {
        profileUrls.push(url);
      }
    });

    profileUrls = profileUrls.slice(0, 1);


    const promises = [];

    profileUrls.forEach((url) => {
      promises.push(request.get(url).then((response) => {
        return this.parseDetailpage(url, response);
      }));
    });

    const people = await Promise.all(promises);

    return people;
  }

}


const instance = new Cssh();

instance.main();

export default instance;
