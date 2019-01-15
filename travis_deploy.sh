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

npm run test

# Make sure everything passes linting
./node_modules/eslint/bin/eslint.js backend/ frontend/ common/

# This step runs regardless of branch, to ensure that any changes to the code did not break the build. 
echo 'Building the code for production.'
npm run build

# Check to make sure there are no arrow functions in the output
NUM_OF_ARROWS=$(cat public/*.js | grep  =\> | wc -l | awk '{$1=$1};1')

if [ "$NUM_OF_ARROWS" -ne "0" ]
then
  echo 'ERROR FOUND =\>' $NUM_OF_ARROWS
  exit 1
fi


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
  
  ssh -o StrictHostKeyChecking=no ubuntu@34.225.112.42 'cd searchneu; git reset --hard'
  ssh -o StrictHostKeyChecking=no ubuntu@34.225.112.42 'cd searchneu; git pull'
  ssh -o StrictHostKeyChecking=no ubuntu@34.225.112.42 'cd searchneu; git checkout prod'

  ssh -o StrictHostKeyChecking=no ubuntu@34.225.112.42 'cd searchneu; mkdir -p public'
  ssh -o StrictHostKeyChecking=no ubuntu@34.225.112.42 'cd searchneu; mkdir -p dist'

  scp -o StrictHostKeyChecking=no -r public/* ubuntu@34.225.112.42:~/searchneu/public
  scp -o StrictHostKeyChecking=no -r dist/* ubuntu@34.225.112.42:~/searchneu/dist

  ssh -o StrictHostKeyChecking=no ubuntu@34.225.112.42 'cd searchneu; yarn; npm run start_prod'

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


  # Deploy to npm if this is a PROD deploy and not a cron job.
  if [ "$TRAVIS_EVENT_TYPE" != "cron" ]; then
    # This part just increments the version in package.json to one greater than the one currently in prod
    # The actually deploying is handled by travis. 
    NEWVER=$(./node_modules/semver/bin/semver -i $(npm show searchneu version))
    echo $NEWVER
    node ./node_modules/json/lib/json.js  -I -f package.json -e 'this.version="'$NEWVER'"'
    git commit -a -m "Updated version"

  fi
fi


echo "Done travis_deploy.sh"