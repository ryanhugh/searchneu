app.post('/subscribeEmail', wrap(async (req, res) => {
  // Don't cache this endpoint.
  res.setHeader('Cache-Control', 'no-cache, no-store');

  if (!req.body || !req.body.email) {
    macros.log('invalid email ingored:', req.body);
    res.send(JSON.stringify({
      error: 'nope.',
    }));
    return;
  }

  if (macros.occurrences(req.body.email, '@', true) !== 1) {
    macros.log('invalid email ingored:', req.body);
    res.send(JSON.stringify({
      error: 'nope.',
    }));
    return;
  }

  macros.logAmplitudeEvent('Backend Email Submit', { email: req.body.email });
  macros.log(req.body.email, 'subscribing');

  // Regardless of what happens from here out, we want to tell the user this was successful.
  // So tell them now to prevent some delay.
  res.send(JSON.stringify({
    status: 'success',
  }));

  const body = {
    email_address: req.body.email,
    status: 'subscribed',
  };

  const mailChimpKey = macros.getEnvVariable('mailChimpKey');

  if (mailChimpKey) {
    if (macros.PROD) {
      macros.log('Submitting email', req.body.email, 'to mail chimp.');

      // The first part of the url comes from the API key.
      let response;

      try {
        response = await request.post({
          url: 'https://us16.api.mailchimp.com/3.0/lists/31a64acc18/members/',
          headers: {
            Authorization: `Basic: ${mailChimpKey}`,
          },
          body: JSON.stringify(body),
        });
      } catch (e) {
        macros.log('Failed to submit email', req.body.email);

        // Don't tell the frontend this email has already been submitted.
        return;
      }

      macros.log(response.body);
    } else {
      macros.log('Not submitting ', req.body.email, 'to mailchimp because not in PROD');
    }
  } else {
    macros.log("Not submitting to mailchip, don't have mailchimp key.");
  }
}));


