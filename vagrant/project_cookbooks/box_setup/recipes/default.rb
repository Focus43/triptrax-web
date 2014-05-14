# Set the default Locale file for the OS
cookbook_file 'etc/default/locale'  do
	owner 	'root'
	group 	'root'
	mode	  0644
	source	'locale'
end

