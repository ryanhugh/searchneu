import cheerio from 'cheerio';
import URI from 'urijs';

import utils from './utils';
import linkSpider from './linkSpider';
import request from './request';


class Camd {
  
  
  getShallowText(elements) {
    
    let retVal = []
    elements.forEach(function(element){
      
      if (element.type !== 'text') {
        return;
      }
      
      let text = element.data.trim()
      if (text.length > 0) {
        retVal.push(text)  
      }
    })
    return retVal
  }
  
  
  parseDetailpage(url, resp) {
    
    let obj = {}
    
    obj.url = url
    
    const $ = cheerio.load(resp.body);
    
    
    obj.name = $('#main > div.pagecenter > div > div > div > div > div.col10.last.right > h1.entry-title').text().trim()
    
    
    // obj.image = $('#main > div.pagecenter > div > div > div > div > div.col5 > img')
    obj.image = $('#main > div.pagecenter > div > div > div > div > div.col5 > img.wp-post-image').attr('src')
    if (obj.image) {
      obj.image = obj.image.trim()
    }
    
    // Job Title
    // "Associate Professor – Design, Interactive Media"
    obj.title = $('#main > div.pagecenter > div > div > div > div > div.col10 > p.introp').text().trim()
    
    // Phone number and office location are just both in a <p> element separated by <br>. 
    // Dump all the text and then figure out where the phone and office is. 
    let descriptionElements = $('#main div.pagecenter div.gdcenter div.col16 > div.col5 > p.smallp')[0].children
    
    let email = $('#main > div.pagecenter > div > div > div > div:nth-child(1) > div.col5 > p > a').text().trim()
    email = utils.standardizeEmail(email)
    if (email) {
      obj.email = email;
    }
    
    let texts = this.getShallowText(descriptionElements)
    
    let phone = null;
    texts.forEach(function(text){
      text = text.trim()
      let possiblePhone = utils.standardizePhone(text)
      if (possiblePhone) {
        if (obj.phone) {
          console.log('duplicate phone??', obj.phone, possiblePhone)
        }
        
        obj.phone = possiblePhone  
      }
      
      // Might be office
      else if (text.length > 5) {
        if (obj.office) {
          console.log('dup office???', obj.office, text)
        }
        if (text.startsWith('Office: ')) {
          text = text.slice('Office: '.length)
        }
        obj.office = text
      }
      else {
        console.log('Warn: unknown prop in description', text)
      }
    })
    
    return obj;
  }
  
  
  
  async main() {
    
    let startingLinks = ['https://camd.northeastern.edu/architecture/faculty-staff',
    'https://camd.northeastern.edu/artdesign/faculty-staff',
    'https://camd.northeastern.edu/commstudies/faculty-staff',
    'https://camd.northeastern.edu/gamedesign/faculty-staff',
    'https://camd.northeastern.edu/journalism/faculty-staff',
    'https://camd.northeastern.edu/mscr/faculty-staff',
    'https://camd.northeastern.edu/music/faculty-staff',
    'https://camd.northeastern.edu/theatre/faculty-staff']
    
    
    let urls = await linkSpider.main(startingLinks)
    
    let profileUrls = []
    
    // Filter all the urls found to just profile urls
    //  'https://camd.northeastern.edu/artdesign/people/magy-seif-el-nasr-2/',
    urls.forEach(function(url){
      if (url.match(/https:\/\/camd.northeastern.edu\/(architecture|artdesign|commstudies|gamedesign|journalism|mscr|music|theatre)\/people\/[\w\d-]+\/?/i)) {
        profileUrls.push(url)
      }
    })
    
    
    let promises = []
    
    profileUrls.forEach((url) => {
      promises.push(request.get(url).then((response) => {
        return this.parseDetailpage(url, response)
      }))
    })
    
    let people = await Promise.all(promises)
    
    return people;
    
  }
  
}



const instance = new Camd()

instance.main()

export default instance;