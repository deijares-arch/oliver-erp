@echo off

set DATA=%date:~-4,4%-%date:~-7,2%-%date:~-10,2%

cd /d "C:\Program Files\MariaDB 12.2\bin"

mariadb-dump -u root -pdbo130312 sistema_saas > "H:\Meu Drive\Backup sistema saas\backup_%DATA%.sql"