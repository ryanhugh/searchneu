var superagent = require('superagent')



// so the old endpoints at coursepro returned application/octet-stream content type, which superagent just silenty dosen't parse...
// could probably setup a bug example on github pages. looks like github pages returns a content type based on file extention

// 
 superagent
   // .get('https://coursepro.io/listClasses/neu.edu/201760')
   .get('https://raw.githubusercontent.com/ryanhugh/NEU-employee-directory/0ef55d1eaacbd058758321d2c6ef58bb632ba4ed/data.json')
   .responseType('application/json')
   .buffer()
   // .get('http://localhost/listClasses/neu.edu/201760')
   // .set('Accept', 'application/octet-stream')
   .responseType('application/json')
   .end(function(err, res){
     if (err || !res.ok) {
       console.log('Oh no! error', err, res);
     } else {
     	debugger
       console.log('yay got ' , res, res.text.length);
     }
   })
   .responseType('application/json')
