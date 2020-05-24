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

//连接数据库
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

//改变柜子在线状态
async function updateBoxOnlineStatus(online) {
  const [err, cursor] = await awaitWrap(db.query(aql`for i in box update i with {status:${online}} in box return NEW`));
  if (err) {
    console.log('err: ', err);
  }
}

//改变柜门线状态
async function updateBoxDoorStatus(key,status) {
  //更新 柜门状态
  let result = {};
  const [err, cursor] = await awaitWrap(db.query(aql`update ${key} with {door_status:${status} in box return NEW`));
  if (err) {
    console.log('err: ', err);
    result.data = 'db failed.';
  } else {
    result.data = await cursor.all();
    result.success = true;
  }
  return result;
}

//打开柜门
async function openDoor(key,io) {
  //todo io open box door 传送操作状态 "异常" "借出" "在库" "储位调整出（异常+新的柜号+解除旧柜子分配+增加新柜子分配）" "储位调整进（在库）"
  io.sockets.sockets[socket.id].emit('client_operate', 'test', (data) => {
    console.log(data);
  });

  // todo 数据库缓存 操作类型和所需值 柜号为 key

  await updateBoxDoorStatus(key,true);
}

//关闭柜门
async function closeDoor(key) {
  //todo 更新 柜子状态 box_status by key && 档案状态 doc.doc_status by box_id == key

  // todo 读取数据库缓存 进行相应操作

  await updateBoxDoorStatus(key,false);
}

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
      updateBoxOnlineStatus(true);
      socket.on('disconnect', function () {
        console.log('user disconnected');
        updateBoxOnlineStatus(false);
      });

      // receive server_operate command
      socket.on('server_operate',async (command, fn) => {
        console.log('receive a event server_operate: ', command);
        let result = false;
        switch (command) {
          case 'closeDoor':
            result = await closeDoor();
            break;
          case 'stop':
            // result = fanStop();
            break;
          case 'sendToServer':
            // result = sendMessage(id);
            break;
          default:
            console.log('Sorry, can\'t find command ' + command + '.');
        }
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

    //获取所有档案
    exp.all('/doc/gets', async (req, res) => {
      const [err, cursor] = await awaitWrap(db.query(aql`for i in doc sort i.box_id return i`));
      if (err) {
        res.send('db failed.');
      } else {
        const result = await cursor.all();
        res.send(result);
      }
    });

    //添加异常档案
    exp.all('/doc/add', async (req, res) => {

      //todo invoke openDoor "在库"
      //todo 更新 box   assign_status:true by box_id
      let doc = req.body;
      doc.doc_status = "异常";
      const [err, cursor] = await awaitWrap(db.query(aql`insert ${req.body} into doc return NEW`));
      if (err) {
        console.log('err: ', err);
        res.send('db failed.');
      } else {
        const result = await cursor.all();
        res.send(result);
      }
    });

    //删除异常档案
    exp.all('/doc/delete', async (req, res) => {
      //todo 更新 box   assign_status:false by box_id
      const result = {};
      const [err, cursor] = await awaitWrap(db.query(aql`remove ${req.body.key} in doc return OLD`));
      if (err) {
        console.log('err: ', err);
        result.data = 'db failed.';
      } else {
        result.data = await cursor.all();
        result.success = true;
      }
      res.send(result);
    });

    //获取所有柜子
    exp.all('/box/gets', async (req, res) => {
      const [err, cursor] = await awaitWrap(db.query(aql`for i in box sort i._key return i`));
      if (err) {
        res.send('db failed.');
      } else {
        const result = await cursor.all();
        res.send(result);
      }
    });

    //打开柜门
    exp.all('/box/open', async (req, res) => {
      //todo 接收操作状态 "异常" "借出" "在库"
      openDoor();
      res.send(result);
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
