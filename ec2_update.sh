set -v 
set -e

# Update npm packages
yarn

# Make sure we still have access to bind to port 80
sudo setcap 'cap_net_bind_service=+ep' $(which nodejs)

# Restart the server with the latest code
./node_modules/forever/bin/forever stopall
./node_modules/forever/bin/forever -a -l forever.log -o log.log -e error.log start backend_compiled/server.js 