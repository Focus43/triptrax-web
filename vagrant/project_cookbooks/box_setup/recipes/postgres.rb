# If hstore enabled, add create extension to the template
if node[:box_setup][:postgres][:hstore]
  execute "Adding hstore extension to Postgres Template 1" do
    command <<-EOC
      sudo -u vagrant psql -d template1 -c "CREATE EXTENSION IF NOT EXISTS hstore";
    EOC
    action :run
  end
end

# If postgis enabled, add create extension to the template
if node[:box_setup][:postgres][:gis]
  execute "Adding PostGIS extension to Postgres Template1" do
    command <<-EOC
      sudo -u vagrant psql -d template1 -c "CREATE EXTENSION IF NOT EXISTS postgis";
    EOC
    action :run
  end
end