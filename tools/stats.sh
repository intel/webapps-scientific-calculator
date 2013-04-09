i=0

grunt reinstall

while [[ $i -lt 10 ]] ; do
  grunt restart
  sleep 5
  i=`calc $i+1`
done

grunt sdb:stop sdb:debug
