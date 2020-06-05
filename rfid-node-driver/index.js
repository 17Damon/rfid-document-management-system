/**
 * - 作者
 * - 马文静
 **/

'use strict';

//rfid reader ljyzn-105
const SerialPort = require('serialport');
const CRC = require('crc-full').CRC;
const crc = CRC.default("CRC16_MCRF4XX");
// right crc example '04ff211995'

const express = require('express');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();
const sever_port = 13000;

let io = {};
let socket_object = {};
let global_get_do_type = '';

// 当前串口
let global_port = {};

//串口连接状态
let global_port_status = false;

// todo all code logic can use Promise to ignore serialport event system
let global_epc_id_hex_str = '';
let global_student_id_str = '123456789012';

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

    io.on('connection', async (socket) => {
      console.log(socket.handshake.query.type + ' user connected socket id: ', socket.id);

      socket.on('disconnect', async () => {
        console.log(socket.handshake.query.type + ' user disconnected');

      });

      // receive server_operate command
      socket.on('server_operate', async (payload, fn) => {
        console.log('receive a event server_operate: ', payload);
        if (!global_port_status || !global_port.write) {
          console.log('未找到设备，开始重新查找连接，尝试次数1次.');
          await getPort();
          if (!global_port_status) {
            // emit event to send to invoker
            if (socket_object.browser) {
              io.sockets.sockets[socket_object.browser.id].emit('no_reader', 'test', (data) => {
                console.log(data);
              });
            }
            return;
          }
        }
        let result = false;
        switch (payload.type) {
          case 'get':
            result = await get();
            break;
          // payload.get_do_type === 'read'
          // payload.get_do_type === 'write'  payload.student_id_str
          case 'getDo':
            result = await getDo(payload);
            break;
          case 'read':
            result = await read(payload.epc_hex_str);
            break;
          case 'write':
            result = await write(payload.epc_hex_str, payload.student_id_str);
            break;
          default:
            console.log('Sorry, can\'t find command ' + payload.type + '.');
        }
        if (result) {
          fn('server_completed');
        } else {
          fn('server_failed');
        }

      });

    });

    // open json style
    exp.use(express.json());

    // example
    exp.all('/box/gets', async (req, res) => {
      if (err) {
        res.send('db failed.');
      } else {
        const result = {};
        res.send(result);
      }
    });

    exp.all('*', (req, res) => {
      return handle(req, res)
    });

    server.listen(sever_port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${sever_port}`)
    })
  })
  .catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });

function isValid(token) {
  return (token === "cde");
}

const awaitWrap = (promise) => {
  return promise
    .then(data => [null, data])
    .catch(err => [err, null])
};

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let crc16_chcek = (order) => {
  let computed_crc = crc.compute(Buffer.from(order, "hex"));
  let computed_crc_hex = computed_crc.toString(16);
  return order + computed_crc_hex.slice(2) + computed_crc_hex.slice(0, 2);
};

let friendlyHex = (str) => {
  return str.replace(/(.{2})/g, '$1 ');
};

let num2HexStr = (num) => {
  let hexStr = num.toString(16);
  if (num <= 0xf) {
    //单位数前面补0
    return '0' + hexStr;
  }
  return hexStr;
};

let sendOrder = (order) => {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(crc16_chcek(order), 'hex');
    if (global_port.write) {
      global_port.write(buf, async (err) => {
        if (err) {
          console.log(`send order ${friendlyHex(order)} error: `, err.message);
          reject(true);
        }

        //todo order name list ,add order friendly name
        console.log(`\norder ${friendlyHex(order)}is send.`);
        await timeout(30);
        resolve(true);
      });
    } else {
      console.log(`\norder ${friendlyHex(order)}is not send.`);
    }
  })
};

let beep = async () => {
  const order = '07ff33010001';
  const [err, data] = await awaitWrap(sendOrder(order));
  return !err;
};

let testReadLock = async () => {
  const order = '04ff0b';
  const [err, data] = await awaitWrap(sendOrder(order));
  return !err;
};

let get = async () => {
  const order = '04ff0f';
  return await sendOrder(order);
};

let getDo = async (payload) => {
  global_get_do_type = payload.get_do_type;
  if (payload.get_do_type === 'write') {
    global_student_id_str = payload.student_id_str;
  }
  const order = '04ff0f';
  const [err, data] = await awaitWrap(sendOrder(order));
  return !err;
};

let read = async (epc_hex_str) => {
  // enum以字为单位 epc_id 以字节为单位 一个字等于两个字节，一个字为4位16进制 一个字节为2位16进制 例如：epc_id 长度为0x0c  下发时enum 长度值改为一半 0x06
  let enum_hex_str = num2HexStr((epc_hex_str.length / 4));
  // enum_hex_str 不可以设定为 '00';
  let mem_hex_str = '03';
  let wordptr_hex_str = '00';
  let num_hex_str = '06';
  let pwd_hex_str = '00000000';

  console.log("\nenum_hex_str: ", friendlyHex(enum_hex_str));
  console.log("epc_hex_str: ", friendlyHex(epc_hex_str));
  console.log("mem_hex_str: ", friendlyHex(mem_hex_str));
  console.log("wordptr_hex_str: ", friendlyHex(wordptr_hex_str));
  console.log("num_hex_str: ", friendlyHex(num_hex_str));
  console.log("pwd_hex_str: ", friendlyHex(pwd_hex_str));

  let data_hex_str =
    enum_hex_str +
    epc_hex_str +
    mem_hex_str +
    wordptr_hex_str +
    num_hex_str +
    pwd_hex_str;

  let order = num2HexStr(4 + data_hex_str.length / 2) + 'ff02' + data_hex_str;
  const [err, data] = await awaitWrap(sendOrder(order));
  return !err;
};

let write = async (epc_hex_str, student_id_str) => {
  let wdt_buf = Buffer.from(student_id_str, 'utf-8');
  let wnum_hex_str = num2HexStr(wdt_buf.length / 2);
  //epc_id 以字节为单位 一个字等于两个字节，一个字等于4位16进制 长度为0c  下发时enum 长度值改为一半 06
  let enum_hex_str = num2HexStr((epc_hex_str.length / 4));
  // enum_hex_str 不可以设定为 '00';
  let mem_hex_str = '03';
  let wordptr_hex_str = '00';
  let wdt_hex_str = wdt_buf.toString('hex');
  let pwd_hex_str = '00000000';

  console.log("\nwnum_hex_str: ", friendlyHex(wnum_hex_str));
  console.log("enum_hex_str: ", friendlyHex(enum_hex_str));
  console.log("epc_hex_str: ", friendlyHex(epc_hex_str));
  console.log("mem_hex_str: ", friendlyHex(mem_hex_str));
  console.log("wordptr_hex_str: ", friendlyHex(wordptr_hex_str));
  console.log("wdt_hex_str: ", friendlyHex(wdt_hex_str));
  console.log("pwd_hex_str: ", friendlyHex(pwd_hex_str));

  let data_hex_str =
    wnum_hex_str +
    enum_hex_str +
    epc_hex_str +
    mem_hex_str +
    wordptr_hex_str +
    wdt_hex_str +
    pwd_hex_str;

  let order = num2HexStr(4 + data_hex_str.length / 2) + 'ff03' + data_hex_str;

  const [err, data] = await awaitWrap(sendOrder(order));
  return !err;
};

let operater = {};

operater['0f'] = async (data_hex, status) => {
  let payload = {};
  if (status === '00' || status === '01') {
    // await beep();
    let epc_length = parseInt(data_hex.slice(10, 12), 16) * 2;
    let epc_id_hex_str = data_hex.substr(12, epc_length);
    console.log('get card success, card epc-id: ', friendlyHex(epc_id_hex_str));
    // store epc_id to global_epc_id_hex_str
    global_epc_id_hex_str = epc_id_hex_str;
    payload.success = true;
    payload.epc_id_hex_str = epc_id_hex_str;
    if (global_get_do_type === 'read') {
      await read(epc_id_hex_str);
    } else if (global_get_do_type === 'write') {
      await write(epc_id_hex_str, global_student_id_str);
    } else {
      //nothing to do
    }
  } else {
    payload.success = false;
    payload.data_hex = data_hex;
    console.log('get card fail.');
  }
  // emit event to send to invoker
  if (socket_object.browser) {
    io.sockets.sockets[socket_object.browser.id].emit('rfid_get', payload, (data) => {
      console.log(data);
    });
  }
};

operater['02'] = async (data_hex, status) => {
  let payload = {};
  if (status === '00' || status === '01') {
    let student_id_hex_str = data_hex.slice(8, -4);
    let student_id = Buffer.from(student_id_hex_str, 'hex').toString('utf-8');
    console.log('read student_id success, student_id: ', friendlyHex(student_id_hex_str));
    console.log('student_id: ', student_id);
    payload.success = true;
    payload.student_id = student_id;
  } else {
    payload.success = false;
    payload.data_hex = data_hex;
    console.log('read card fail.');
  }
  // emit event to send to invoker
  if (socket_object.browser) {
    io.sockets.sockets[socket_object.browser.id].emit('rfid_read', payload, (data) => {
      console.log(data);
    });
  }
};

operater['03'] = async (data_hex, status) => {
  let payload = {};
  if (status === '00' || status === '01') {
    payload.success = true;
  } else {
    payload.success = false;
    payload.data_hex = data_hex;
    console.log('write card fail.');
  }
  // emit event to send to invoker
  if (socket_object.browser) {
    io.sockets.sockets[socket_object.browser.id].emit('rfid_write', payload, (data) => {
      console.log(data);
    });
  }
};


let getPort = async () => {

  let ports = await SerialPort.list();
  for (let i = 0; i < ports.length; i++) {
    const [err, data] = await awaitWrap(testPort(ports[i].path));
    if (err) {
      console.log('fail: ', ports[i].path);
    } else {
      console.log('success: ', ports[i].path);
      break;
    }
  }

  if (!global_port_status) {
    console.log('无可用 RFID Reader.');
  }
  return global_port_status;
};

let testPort = (path) => {
  return new Promise(async (resolve, reject) => {
    let temp_port = new SerialPort(
      path,
      {
        baudRate: 57600
      },
      (err) => {
        console.log('\nnew serialport: ', path);
        if (err) {
          console.log('new serialport error: ', err.message);
          reject(true);
        }
      });

    temp_port.on('error', (err) => {
      console.log(`port ${path} error: ${err.message}`);
      // 断开设备后，只有被动操作，才能触发 close event
      if (socket_object.browser) {
        io.sockets.sockets[socket_object.browser.id].emit('error_reader', 'test', (data) => {
          console.log(data);
        });
      }
    });

    temp_port.on('open', () => {
      console.log(`\nport ${path} is open.`);
    });

    temp_port.on('close', () => {
      global_port = {};
      global_port_status = false;
      console.log(`port ${path} is close.`);
      // 断开设备后，只有被动操作，才能触发 close event
    });

    temp_port.on('data', async (answer) => {
      let data_hex = answer.toString('hex');
      let re_cmd = data_hex.slice(4, 6);
      let status = data_hex.slice(6, 8);
      let data = data_hex.slice(8, -4);
      console.log("\nre_cmd: ", re_cmd);
      console.log("status: ", status);
      console.log("data: ", friendlyHex(data));
      console.log('answer:', answer);

      switch (re_cmd) {
        //get one card
        case '0f':
          await operater['0f'](data_hex, status);
          break;
        //read one card
        case '02':
          await operater['02'](data_hex, status);
          break;
        //write one card
        case '03':
          await operater['03'](data_hex, status);
          break;
        //test reader
        case '21':
          await (async () => {
            console.log(`port ${path}, reader is ok.`);
            global_port = temp_port;
            global_port_status = true;
            resolve(true);
          })();
          break;
        default:
          console.log(`no case found, re_cmd ${re_cmd} is complete, status is ${status}.\n`);
          temp_port.close();
          reject(true);
      }

    });

    const buf = Buffer.from(crc16_chcek('04ff21'), 'hex');
    temp_port.write(buf, (err) => {
      if (err) {
        console.log(`testPort send order 04 ff 21 error: ', ${err.message}`);
        temp_port.close();
        reject(true);
      }
    });

    console.log();
    // port 应答超时
    await timeout(20);
    if (!global_port_status) {
      console.log('应答超时.');
      temp_port.close();
      reject(true);
    }
  })
};

// init port
(async () => {
  await getPort();
})();

// (async () => {
//   await beep();
// })();
