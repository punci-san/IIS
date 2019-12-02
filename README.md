### Requirements

node 10+
npm 6+
mysql database running on local server

### Instalation

Go to main directory and run `sudo npm i` then run the same command in client and server directories.

### Start

Before starting application you need to import file `tables.sql` located in main directory into database. This file will create new database `web_app` and database account that will be used for connecting to that database. After that it will insert into database tables and will initialize table users with users `admin` and `user`.  After that use command `npm run build` in main directory to start project then go to `http://localhost:4201/`.

### Development

When developing open 2 consoles. First for client where you go into client folder and run `ng serve` which will start development server on  adress `localhost:4200` and will automaticly rebuild client side on each save in client folder and second one where you go into server folder and run `sudo npm run debug` and you need to run this command each time you change something in server folder
