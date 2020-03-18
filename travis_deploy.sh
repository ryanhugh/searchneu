# This file is part of Search NEU and licensed under AGPL3. 
# See the license file in the root folder for details. 

# Exit if any commands fail. 
trap 'exit' ERR

# Echo each command as they are ran
set -v

# The three following commands can be ran in any order
# At one point we tried to run them in parrallel with job1 &\n job2 & \n wait $(jobs -p)
# but it wasen't any faster than just running them in series
# and in parallel the output from all three commands would be squished together. 
# Might be worth looking into this again if the jobs are slow in the future. 

# We can't use npm run test directly because it adds some output, which messes up coveralls
./node_modules/jest-cli/bin/jest.js --coverage --coverageReporters=text-lcov --testPathIgnorePatterns='(reg.js|seq.js)' | ./node_modules/coveralls/bin/coveralls.js

# Make sure everything passes linting
# Run the commands separately, so if one fails, this script fails
# (If npm run lint is ran, the exit code of npm run lintjs is ignored and the exit code of only npm run lintstyle is read)
npm run lintjs
npm run lintstyle

# This step runs regardless of branch, to ensure that any changes to the code did not break the build. 
echo 'Building the code for production.'
npm run build

# Check to make sure there are no arrow functions in the output
# https://github.com/babel/babel/issues/9300
NUM_OF_ARROWS=$(cat public/*.js | grep  =\> | wc -l | awk '{$1=$1};1')

if [ "$NUM_OF_ARROWS" -ne "0" ]
then
  echo 'ERROR FOUND =\>' $NUM_OF_ARROWS
  exit 1
fi


# Make sure files in folders can run also be ran with babel-node
# https://github.com/babel/babel/issues/9750
cd backend
npm run script macros.js
cd ..


# Pull requests and commits to other branches shouldn't try to deploy
if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
    echo $TRAVIS_PULL_REQUEST
    echo $TRAVIS_BRANCH
    echo $SOURCE_BRANCH
    exit 0
fi

# Log the limits for processes. Travis has some really high limits (500k file descriptors), which is awesome.
ulimit -S -a
ulimit -H -a

# Log the public IP and local time of this server. Useful for figuring out the physical location of the server (Affects ping time of requests). 
curl --insecure https://api.ipify.org/
echo ""
date
echo
git --version
echo
bash --version
echo

# If this is a cron job, run the scrapers.
# We are going to combile the backend to ES5 anyway, so might as well run the ES5 to do the scraping too.
# Also this has less RAM usage so it should be Killed less on travis.
if [ "$TRAVIS_EVENT_TYPE" == "cron" ]; then
  cd dist/backend/scrapers
  PROD=true NODE_ENV=prod node --max_old_space_size=8192 startup
  cd ../../..
  find public
fi


eval "$(ssh-agent -s)"
mkdir -p ~/.ssh 2> /dev/null
echo $GIT_PRIVATE_KEY | base64 --decode > ~/.ssh/id_rsa
chmod 600 ~/.ssh/id_rsa
ssh-add ~/.ssh/id_rsa

# Push to prod if this is the prod branch
if [ "$TRAVIS_BRANCH" == "prod" ]; then
  echo 'Deploying to prod'
  
  # Check to see if the SSL certificate needs to be renewed
  # If it does, try to renew it
  # if renewal is successful, restart nginx
  # Hooks will only be run if a certificate is due for renewal and the deploy-hook will only run if renewal is successful.
  # https://certbot.eff.org/docs/using.html#pre-and-post-validation-hooks
  ssh -o StrictHostKeyChecking=no ubuntu@3.226.156.218 'sudo certbot renew --deploy-hook "sudo service nginx restart"'

  ssh -o StrictHostKeyChecking=no ubuntu@3.226.156.218 'cd searchneu; git reset --hard'
  ssh -o StrictHostKeyChecking=no ubuntu@3.226.156.218 'cd searchneu; git pull'
  ssh -o StrictHostKeyChecking=no ubuntu@3.226.156.218 'cd searchneu; git checkout prod'

  ssh -o StrictHostKeyChecking=no ubuntu@3.226.156.218 'cd searchneu; mkdir -p public'
  ssh -o StrictHostKeyChecking=no ubuntu@3.226.156.218 'cd searchneu; mkdir -p dist'

  scp -o StrictHostKeyChecking=no -r public/* ubuntu@3.226.156.218:~/searchneu/public
  scp -o StrictHostKeyChecking=no -r dist/* ubuntu@3.226.156.218:~/searchneu/dist
  scp -o StrictHostKeyChecking=no -r .sequelizerc ubuntu@3.226.156.218:~/searchneu/dist/.sequelizerc

  if [ "$TRAVIS_EVENT_TYPE" == "cron" ]; then
    # If this is a cron job, we need to take down the server while the re-index is running so users's don't get invalid or incomplete data.
    # Taking down the server isn't idea, but its better than caches (both on our side and the user's side) getting invalid or incomplete data.
    ssh -o StrictHostKeyChecking=no ubuntu@3.226.156.218 'cd searchneu; npm run stop_prod; yarn; yarn prod_migrate; NODE_ENV=prod npm run store; npm run start_prod'
  else
    # If this is not a cron job, we don't have to take down the server for a few seconds.
    # Install any new packages while it is running, and then reboot the server.
    ssh -o StrictHostKeyChecking=no ubuntu@3.226.156.218 'cd searchneu; yarn; npm run start_prod'
  fi

  # Tell Rollbar about the deploy
  ACCESS_TOKEN=$ROLLBAR_TOKEN
  ENVIRONMENT=production
  LOCAL_USERNAME=`whoami`
  REVISION=`git log -n 1 --pretty=format:"%H"`

  curl https://api.rollbar.com/api/1/deploy/ \
    -F access_token=$ACCESS_TOKEN \
    -F environment=$ENVIRONMENT \
    -F revision=$REVISION \
    -F local_username=$LOCAL_USERNAME
fi


echo "Done travis_deploy.sh"
