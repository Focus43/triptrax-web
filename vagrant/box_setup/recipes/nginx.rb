# If web server is nginx
if node[:box_setup][:web][:server] == 'nginx'

  # Create the vhost
  template "#{node[:nginx][:dir]}/sites-available/#{node[:box_setup][:project_name]}" do
    source  'nginx.conf.erb'
    mode    '0644'
  end

  # Enable
  nginx_site "#{node[:box_setup][:project_name]}"

end