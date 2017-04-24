import cheerio from 'cheerio';
import URI from 'urijs';

import linkSpider from './linkSpider';
import request from './request';


class Camd {
  
  async main() {
    
    let urls = await linkSpider.main('https://camd.northeastern.edu/artdesign/community/faculty-staff/')
    
    let profileUrls = []
    
    
    // https://camd.northeastern.edu/architecture/faculty-staff
    // https://camd.northeastern.edu/artdesign/faculty-staff
    // https://camd.northeastern.edu/commstudies/faculty-staff
    // https://camd.northeastern.edu/gamedesign/faculty-staff
    // https://camd.northeastern.edu/journalism/faculty-staff
    // https://camd.northeastern.edu/mscr/faculty-staff
    // https://camd.northeastern.edu/music/faculty-staff
    // https://camd.northeastern.edu/theatre/faculty-staff
    
    // console.log(urls)
    
    //  'https://camd.northeastern.edu/artdesign/people/magy-seif-el-nasr-2/',
    urls.forEach(function(url){
      if (url.match(/https:\/\/camd.northeastern.edu\/(architecture|artdesign|commstudies|gamedesign|journalism|mscr|music|theatre)\/people\/[\w\d-]+\/?/i)) {
        profileUrls.push(url)
      }
    })
    
    
    
    
    // name
    // #main > div.pagecenter > div > div > div > div:nth-child(1) > div.col10.last.right > h1
    
    
    // photo
    // #main > div.pagecenter > div > div > div > div:nth-child(1) > div.col5 > img
    
    // email
    // #main > div.pagecenter > div > div > div > div:nth-child(1) > div.col5 > p > a
    
    
  }
  
}



const instance = new Camd()

instance.main()

export default instance;