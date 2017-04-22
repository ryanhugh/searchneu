import cheerio from 'cheerio';
import URI from 'urijs';

import request from './request';

class LinkSpider {
  
  async main(inputUrl, depth = 1) {
    
    const inputHost = new URI(inputUrl).hostname()
    
    let history = {}
    let urlStack = [inputUrl]
    let newUrls = []
    
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
          if (newHost !== inputHost) {
            continue;
          }
          
          // Already saw this url, continue
          if (history[url]) {
            continue;
          }
          
          history[url] = true;
        
          linksOnPages.push(url)
        }
      })
      
      urlStack = linksOnPages;
      depth --;
      
      
    }
    
    return urlStack
  }
}



const instance = new LinkSpider()


async function main() {
  
  let a  = await instance.main('https://camd.northeastern.edu/artdesign/community/faculty-staff/')
  
  console.log(JSON.stringify(a, null, 4))  
}

main()

