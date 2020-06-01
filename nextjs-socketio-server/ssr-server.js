/**
 * - 作者
 * - 马文静
 **/

'use strict';

const express = require('express');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();

const {Database, aql} = require('arangojs');
const secret = require('./secret.json');
const db = new Database({url: secret.arango.url});
var io = {};
const socket_object = {};


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

//更新储位在线状态
async function updateBoxOnlineStatus(online) {
  const [err, cursor] = await awaitWrap(db.query(aql`for i in box update i with {status:${online}} in box return NEW`));
  if (err) {
    console.log('err: ', err);
  }
}

//更新储位状态
async function updateBoxStatus(box_id, box_status) {
  const [err, cursor] = await awaitWrap(db.query(aql`update ${box_id} with {box_status:${box_status}} in box return NEW`));
  if (err) {
    console.log('err: ', err);
  }
}

//更新分配状态
async function updateAssignStatus(box_id, assign_status) {
  const [err, cursor] = await awaitWrap(db.query(aql`update ${box_id} with {assign_status:${assign_status}} in box return NEW`));
  if (err) {
    console.log('err: ', err);
  }
}

//更新柜门状态
async function updateBoxDoorStatus(box_id, door_status) {
  //更新 柜门状态
  let result = {};
  const [err, cursor] = await awaitWrap(db.query(aql`update ${box_id} with {door_status:${door_status}} in box return NEW`));
  if (err) {
    console.log('err: ', err);
    result.data = 'db failed.';
  } else {
    result.data = await cursor.all();
    result.success = true;
  }
  return result;
}

//更新档案状态
async function updateDocStatus(box_id, doc_status) {
  const [err, cursor] = await awaitWrap(db.query(aql`for i in doc filter i.box_id == ${box_id} update i with {doc_status:${doc_status}} in doc return NEW`));
  if (err) {
    console.log('err: ', err);
  }
}

//更新档案储位号
async function updateDocBoxId(box_id, next_box_id) {
  const [err, cursor] = await awaitWrap(db.query(aql`for i in doc filter i.box_id == ${box_id} update i with {box_id:${next_box_id},box_name:${next_box_id+'号柜'}} in doc return NEW`));
  if (err) {
    console.log('err: ', err);
  }
}

//打开柜门
async function openDoor(box_id, operate_type, next_box_id) {

  let payload = {
    type: 'box_open',
    box_id: box_id,
    operate_type: operate_type,
    next_box_id: next_box_id
  };

  //打开柜门
  io.sockets.sockets[socket_object['box'].id].emit('client_operate', payload, (data) => {
    console.log(data);
  });

  //通知柜门打开
  io.sockets.sockets[socket_object['browser'].id].emit('notice_box_door_open', 'test', (data) => {
    console.log(data);
  });

  //更新柜门状态为打开
  await updateBoxDoorStatus(box_id, true);
  return new Promise(resolve => (resolve(true)));
}

//关闭柜门
async function closeDoor(box_id, box_status, operate_type, next_box_id) {

  // 更新储位状态
  await updateBoxStatus(box_id, box_status);
  //更新柜门状态为关闭
  await updateBoxDoorStatus(box_id, false);
  // 更新档案状态
  let result = true;
  if (operate_type === '异常' && !box_status) {
    console.log("updateDocStatus: ");
    await updateDocStatus(box_id, '异常');
  } else if (operate_type === '借出' && !box_status) {
    await updateDocStatus(box_id, '借出');
  } else if (operate_type === '在库' && box_status) {
    await updateDocStatus(box_id, '在库');
  } else if (operate_type === '储位调整出' && !box_status) {
    //释放原储位 && 分配新储位
    await updateAssignStatus(box_id, false);
    await updateAssignStatus(next_box_id, true);
    //档案更新为新储位号 && 状态为异常
    await updateDocBoxId(box_id, next_box_id);
    await updateDocStatus(box_id, '异常');
  } else if (operate_type === '储位调整进' && box_status) {
    await updateDocStatus(box_id, '在库');
  } else {
    result = false;
  }

  // 通知柜门关闭
  io.sockets.sockets[socket_object['browser'].id].emit('notice_box_door_close', box_status, (data) => {
    console.log(data);
  });
  return result;

}

app.prepare()
  .then(() => {
    const exp = express();
    const server = require('http').Server(exp);
    io = require('socket.io')(server);

    // middleware
    io.use((socket, next) => {
      let token = socket.handshake.query.token;
      let type = socket.handshake.query.type;
      if (isValid(token)) {
        console.log("token is right: ", token);
        socket_object[type] = socket;
        return next();
      }
      console.log("token is wrong: ", token);
      return next(new Error('authentication error'));
    });

    io.on('connection', async function (socket) {
      console.log(socket.handshake.query.type + ' user connected socket id: ', socket.id);
      if (socket.handshake.query.type === 'box') {
        await updateBoxOnlineStatus(true);
        if (socket_object.browser) {
          io.sockets.sockets[socket_object.browser.id].emit('box_status_update', true, (data) => {
            console.log(data);
          });
        }
      }
      socket.on('disconnect', async function () {
        console.log(socket.handshake.query.type + ' user disconnected');
        if (socket.handshake.query.type === 'box') {
          await updateBoxOnlineStatus(false);
          if (socket_object.browser) {
            io.sockets.sockets[socket_object.browser.id].emit('box_status_update', false, (data) => {
              console.log(data);
            });
          }
        }
      });

      // receive server_operate command
      socket.on('server_operate', async (payload, fn) => {
        console.log('receive a event server_operate: ', payload);
        let result = false;
        switch (payload.type) {
          case 'closeDoor':
            result = await closeDoor(payload.box_id, payload.box_status, payload.operate_type, payload.next_box_id);
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

    //通过student_id获取档案
    exp.all('/doc/getByStudentId', async (req, res) => {
      const [err, cursor] = await awaitWrap(db.query(aql`for i in doc filter i.student_id==${req.body.student_id} return i`));
      if (err) {
        res.send('db failed.');
      } else {
        const result = await cursor.all();
        res.send(result);
      }
    });

    //添加异常档案
    exp.all('/doc/add', async (req, res) => {
      //invoke openDoor "在库"
      let doc = req.body;
      doc.doc_status = "异常";
      let box_id = doc.box_id;
      await openDoor(box_id, '在库');

      //更新 box   assign_status:true by box_id
      await updateAssignStatus(box_id, true);

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
      console.log('req.body: ', req.body);

      //更新 box   assign_status:false by box_id
      let box_id = req.body.box_id;
      let key = req.body.key;
      await updateAssignStatus(box_id, false);
      const result = {};
      const [err, cursor] = await awaitWrap(db.query(aql`remove ${key} in doc return OLD`));
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

      let operate_type = req.body.operate_type;
      let box_id = req.body.box_id;
      let next_box_id = req.body.next_box_id;
      let result = {};
      await openDoor(box_id, operate_type, next_box_id);
      result.success = true;
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
