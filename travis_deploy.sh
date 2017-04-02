# Pull requests and commits to other branches shouldn't try to deploy
if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
    echo hi
    echo $TRAVIS_PULL_REQUEST
    echo $TRAVIS_BRANCH
    echo $SOURCE_BRANCH
    exit 0
fi

rm test

eval "$(ssh-agent -s)"
echo $GIT_PRIVATE_KEY | base64 --decode > ~/deploy_key
chmod 600 ~/deploy_key
ssh-add ~/deploy_key
git remote remove origin
git remote add origin git@github.com:ryanhugh/neusearch.git
git pull origin master
git pull origin gh-pages
git checkout gh-pages
git config --global user.email "ryanhughes624+gitbot@gmail.com"
git config --global user.name "data-updater-bot"
git merge master --no-edit
git commit -a -m "Merged the latest changes into gh-pages"
# node main.js	
# git commit -a -m "Updated data"
git remote add deploy git@github.com:ryanhugh/neusearch.git
git config --global push.default simple
git push git@github.com:ryanhugh/neusearch.git gh-pages