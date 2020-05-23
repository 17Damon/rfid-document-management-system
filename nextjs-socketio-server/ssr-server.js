'use strict';

const express = require('express');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();

const {Database, aql} = require('arangojs');
const secret = require('./secret.json');
const db = new Database({url: secret.arango.url});


const awaitWrap = (promise) => {
  return promise
    .then(data => [null, data])
    .catch(err => [err, null])
};

db.useDatabase("rfid_dms");
(async function () {
  try {
    const [err, data] = await awaitWrap(db.login(secret.arango.username, secret.arango.password));
    if (err) {
      console.log('login db failed.');
    } else {
      console.log('login db success.');
    }
  } catch (e) {
    console.log('error: ', e);
  }
})();

app.prepare()
  .then(() => {
    const exp = express();
    const server = require('http').Server(exp);
    const io = require('socket.io')(server);

    // middleware
    io.use((socket, next) => {
      let token = socket.handshake.query.token;
      if (isValid(token)) {
        console.log("token is right: ", token);
        return next();
      }
      console.log("token is wrong: ", token);
      return next(new Error('authentication error'));
    });

    io.on('connection', function (socket) {
      console.log('a user connected socket id: ', socket.id);
      // console.log('connected sockets id: ', io.of('/').sockets);
      socket.on('disconnect', function () {
        console.log('user disconnected');
      });

      // receive server_operate command
      socket.on('server_operate', (command, fn) => {
        console.log('receive a event server_operate: ', command);
        let result = false;
        // switch (command) {
        //   case 'start':
        //     result = fanStart();
        //     break;
        //   case 'stop':
        //     result = fanStop();
        //     break;
        //   case 'sendToServer':
        //     result = sendMessage(id);
        //     break;
        //   default:
        //     console.log('Sorry, can\'t find command ' + command + '.');

        if (result) {
          fn('server_completed');
        } else {
          fn('server_failed');
        }

      });

      io.sockets.sockets[socket.id].emit('client_operate', 'test', (data) => {
        console.log(data);
      });

    });

    exp.use(express.json());

    exp.all('/doc/gets', async (req, res) => {
      const [err, cursor] = await awaitWrap(db.query(aql`for i in doc return i`));
      if (err) {
        res.send('db failed.');
      } else {
        const result = await cursor.all();
        res.send(result);
      }
    });

    exp.all('/doc/add', async (req, res) => {
      const [err, cursor] = await awaitWrap(db.query(aql`insert ${req.body} into doc return NEW`));
      if (err) {
        console.log('err: ', err);
        res.send('db failed.');
      } else {
        const result = await cursor.all();
        res.send(result);
      }
    });

    exp.all('/box/gets', async (req, res) => {
      const [err, cursor] = await awaitWrap(db.query(aql`for i in box return i`));
      if (err) {
        res.send('db failed.');
      } else {
        const result = await cursor.all();
        res.send(result);
      }
    });

    exp.all('*', (req, res) => {
      return handle(req, res)
    });

    server.listen(3000, (err) => {
      if (err) throw err;
      console.log('> Ready on http://localhost:3000')
    })
  })
  .catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });

function isValid(token) {
  return (token === "cde");
}
