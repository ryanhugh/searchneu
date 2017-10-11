# Exit if any commands fail. 
trap 'exit' ERR

# Echo each command as they are ran
set -v

npm run test

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

# Use this command to get the stuff in prod into the public folder. 
# time git clone -b gh-pages --single-branch git@github.com:ryanhugh/searchneu.git public
# rm -rf public/.git

# This step runs regardless of branch, to ensure that any changes to the code did not break the build. 
echo 'Building the code for production.'
npm run build

# If this is a cron job, run the scrapers.
# We are going to combile the backend to ES5 anyway, so might as well run the ES5 to do the scraping too.
# Also this has less RAM usage so it should be Killed less on travis.
if [ "$TRAVIS_EVENT_TYPE" == "cron" ]; then
  # npm -g install babel-cli
  cd dist/scrapers
  PROD=true NODE_ENV=prod node --max_old_space_size=8192 startup
  cd ../..
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


    # Deploy to npm
    # echo $NPM_TOKEN | base64 --decode > ~/.npmrc
    # echo email ryanhughes624@gmail.com >> ~/.yarnrc
    # echo username ryanhugh >> ~/.yarnrc
    # echo >> ~/.yarnrc
    # echo "HIII"
    # cat ~/.yarnrc
    # cat ~/.npmrc
    # echo "HIII2"

    # yarn login

    NEWVER=$(./node_modules/semver/bin/semver -i $(npm show searchneu version))
    echo $NEWVER
    # # The new version is one greater than the one currently in prod
    node ./node_modules/json/lib/json.js  -I -f package.json -e 'this.version="'$NEWVER'"'
    git commit -a -m "Updated version"
    # yarn publish --new-version 


fi


echo "Done travis_deploy.sh"