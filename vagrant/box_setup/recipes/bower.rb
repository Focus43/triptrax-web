# If nodejs is enabled, install Bower?
  execute "Installing Bower via NPM" do
    cwd		'/home/vagrant/app'
    user	'root'
    command	'/usr/local/bin/npm install -g bower'
    action	:run
  end

