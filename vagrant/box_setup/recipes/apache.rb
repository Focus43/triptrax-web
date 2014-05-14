# If web server is apache
if node[:box_setup][:web][:server] == 'apache'

  # Add httpd.conf file (eliminate "cannot identify host" shit)
  cookbook_file '/etc/apache2/httpd.conf' do
    owner   'root'
    group   'root'
    mode    0644
    source  'httpd.conf'
  end

  # Enable the default app
  web_app "#{node[:box_setup][:project_name]}" do
    template    'apache_vhost.conf.erb'
    server_name node[:box_setup][:server_name]
    docroot    node[:box_setup][:web][:doc_root]
  end

end