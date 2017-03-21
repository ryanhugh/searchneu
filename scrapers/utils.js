
// Need to abstract the retry and throttle logic too
// max number of simultaneous requests
// auto retry with linear backoff
// application layer dns caching
// keep-alive connections (forever: true in request)
// ignore invalid https certs (rejectUnauthorized: false) and outdated ciphers (ciphers: 'ALL')
  
      




exports.standardizeEmail = function standardizeEmail(email) {
  if (email.startsWith('mailto:')) {
    email = email.slice('mailto:'.length);
  }

  if (!email.includes('@')) {
  	return null
  }

  return email;
};


exports.standardizePhone = function standardizePhone(phone) {
  phone = phone.trim()

  if (phone.startsWith('tel:')) {
    phone = phone.slice('tel:').trim()
  }

  let digitsOnly = phone.replace(/[^0-9]/gi, '');


  if (phone.startsWith('+1') && digitsOnly.length === 11) {
    digitsOnly = digitsOnly.slice(1)
  }

  if (digitsOnly.length != 10) {
  	return null
  }

  return digitsOnly;
};

exports.parseGoogleScolarLink = function parseGoogleScolarLink(link) {
  if (googleScholarLink) {
    const userId = new URI(googleScholarLink).query(true).user;
    if (!userId && googleScholarLink) {
      console.log('Error parsing google url', googleScholarLink);
    } else {
      obj.googleScholarId = userId;
    }
  }
}
