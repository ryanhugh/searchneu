import URI from 'urijs';

exports.standardizeEmail = function standardizeEmail(email) {
  if (email.startsWith('mailto:')) {
    email = email.slice('mailto:'.length);
  }

  if (!email.includes('@')) {
    return null;
  }

  return email;
};


exports.standardizePhone = function standardizePhone(phone) {
  phone = phone.trim();

  if (phone.startsWith('tel:')) {
    phone = phone.slice('tel:'.length).trim();
  }

  let digitsOnly = phone.replace(/[^0-9]/gi, '');


  if (phone.startsWith('+1') && digitsOnly.length === 11) {
    digitsOnly = digitsOnly.slice(1);
  }

  if (digitsOnly.length !== 10) {
    return null;
  }

  return digitsOnly;
};

exports.parseGoogleScolarLink = function parseGoogleScolarLink(link) {
  if (!link) {
    return null;
  }

  const userId = new URI(link).query(true).user;
  if (!userId && link) {
    console.log('Error parsing google url', link);
    return null;
  }
  return userId;
};
