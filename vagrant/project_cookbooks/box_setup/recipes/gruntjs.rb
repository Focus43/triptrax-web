# If nodejs is enabled, install GruntJS?
#if  node[:box_setup][:nodejs][:install] && node[:box_setup][:nodejs][:gruntjs]
  execute "Installing GruntJS via NPM" do
    cwd		'/home/vagrant/app'
    user	'root'
    command	'/usr/local/bin/npm install; /usr/local/bin/npm install -g grunt-cli'
    action	:run
  end
#end