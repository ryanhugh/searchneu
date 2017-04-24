import cheerio from 'cheerio';
import URI from 'urijs';

import request from './request';

class LinkSpider {
  
  async main(inputUrls, depth = 1) {
    if (!inputUrls || inputUrls.length === 0) {
      console.error("Link Spider needs a starting url")
      return null;
    }
    
    let validHostnames = {}
    
    inputUrls.forEach(function (url) {
      validHostnames[new URI(url).hostname()] = true;
    })
    
    
    let history = {}
    let urlStack = inputUrls.slice(0)
    let returnUrls = []
    
    while (depth > 0) {
      
      let promises = []
      
      // Get all the links from all of the URLs
      for (let url of urlStack) {
        promises.push(request.get(url))
      }
      
      let responses = await Promise.all(promises)
      
      let linksOnPages = []
      
      responses.forEach(function(resp) {
        
        const $ = cheerio.load(resp.body);
        let elements = $('a')
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          let url = $(element).attr('href')
          if  (!url) {
            continue;
          }
          let newHost = new URI(url).hostname()
            
            
          // If this link is to a different site, ignore. 
          if (!validHostnames[newHost]) {
            continue;
          }
          
          // Already saw this url, continue
          if (history[url]) {
            continue;
          }
          
          history[url] = true;
        
          linksOnPages.push(url)
          returnUrls.push(url)
        }
      })
      
      urlStack = linksOnPages;
      depth --;
      
      
    }
    
    return returnUrls
  }
}



const instance = new LinkSpider()


// async function main() {
  
//   let a  = await instance.main('https://camd.northeastern.edu/artdesign/community/faculty-staff/')
  
//   console.log(JSON.stringify(a, null, 4), a.length)  
// }

// main()

export default instance;