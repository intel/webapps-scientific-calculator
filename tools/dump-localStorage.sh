APP_ID=$2
KEY=perf-data

PATH=/opt/usr/apps/$APP_ID/data/.webkit/localStorage/file__0.localstorage
SQL="SELECT value FROM ItemTable WHERE key='$KEY'"

echo
echo "*******************************************************"
echo "DUMP OF LOCALSTORAGE FOR APP $2"
echo
/usr/bin/sqlite3 $PATH "$SQL"
