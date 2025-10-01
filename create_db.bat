@echo off
set PGPASSWORD=richman
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE project_management;"
pause