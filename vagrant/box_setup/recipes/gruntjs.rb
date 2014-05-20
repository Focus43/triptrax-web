if node[:nodejs]
  # Fix the self-signed cert issue for NPM; https://twitter.com/npmjs/status/439279809307242496
  execute "Auto-correcting NPM Self-Signed Cert Issue..." do
    cwd   '/home/vagrant'
    user  'root'
    command '/usr/local/bin/npm config set ca=""'
    action  :run
  end

  # If nodejs is enabled, install GruntJS?
  if node[:nodejs][:gruntjs]
    execute "Installing GruntJS via NPM..." do
      cwd     '/home/vagrant'
      user    'root'
      command '/usr/local/bin/npm install -g grunt-cli'
      action  :run
    end
  end
end