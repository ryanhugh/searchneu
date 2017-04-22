import cheerio from 'cheerio';
import URI from 'urijs';

import request from './request';

class LinkSpider {
  
  async main(url, depth) {
    
    const inputHost = new URI(url).hostname()
    console.log(inputHost)
    
    let history = {}
    
    
    let newUrls = []
    
    const resp = await request.get(url)
    
    const $ = cheerio.load(resp.body);
    
    let elements = $('a')
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      let url = $(element).attr('href')
      let newHost = new URI(url).hostname()
      
      // If this link is to a different site, ignore. 
      if (newHost !== inputHost) {
        continue;
      }
      
      // Already saw this url, continue
      if (history[url]) {
        continue;
      }
      
      history[url] = true;
      
      
      newUrls.push(url)
      
      
      // new URI(googleMapSrc).
    }
    
    
    // console.log(a)
    
    
    
    
    
    
  }
  
  
}



const instance = new LinkSpider()

instance.main('https://camd.northeastern.edu/artdesign/community/faculty-staff/')