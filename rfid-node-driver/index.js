/**
 * - 作者
 * - 马文静
 **/

'use strict';

//rfid reader ljyzn-105
const SerialPort = require('serialport');
const CRC = require('crc-full').CRC;
const crc = CRC.default("CRC16_MCRF4XX");
// right crc '04ff211995'

const express = require('express');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();
const sever_port = 13000;

let io = {};
let socket_object = {};
let global_get_do_type = '';

// todo all code logic can use Promise to ignore serialport event system
let global_epc_id_hex_str = '';
let global_student_id_str = '123456789012';

// SerialPort.list().then(ports => console.log(ports));
const port = new SerialPort('/dev/tty.usbserial-0001', {
  baudRate: 57600
});

// Open errors will be emitted as an error event
port.on('error', function (err) {
  console.log('port error: ', err.message)
});

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

      socket.on('disconnect', async function () {
        console.log(socket.handshake.query.type + ' user disconnected');

      });

      // receive server_operate command
      socket.on('server_operate', async (payload, fn) => {
        console.log('receive a event server_operate: ', payload);
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
    // console.log("\nbuf: ", buf);
    // console.log("buf_length: ", buf.length);
    port.write(buf, async (err) => {
      if (err) {
        console.log(`Error on order ${friendlyHex(order)}: `, err.message);
        reject(false);
      }

      //todo order name list ,add order friendly name
      console.log(`\norder ${friendlyHex(order)}is send.`);
      await timeout(30);
      resolve(true);
    });

  })
};

let beep = async () => {
  const beep_order_crc = '07ff33010001';
  return await sendOrder(beep_order_crc);
};

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let testReadLock = async () => {
  const order = '04ff0b';
  return await sendOrder(order);
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
  return await sendOrder(order);
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

  console.log("data_hex_str: ", friendlyHex(data_hex_str));
  console.log("data_hex_str.length: ", data_hex_str.length);

  let order = num2HexStr(4 + data_hex_str.length / 2) + 'ff02' + data_hex_str;
  return await sendOrder(order);
};

let write = async (epc_hex_str, student_id_str) => {
  let wdt_buf = Buffer.from(student_id_str, 'utf-8');
  console.log("\nwdt_buf: ", wdt_buf);

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

  console.log("data_hex_str: ", friendlyHex(data_hex_str));
  console.log("data_hex_str_length: ", data_hex_str.length);
  console.log("data_buf_length: ", Buffer.from(data_hex_str, 'hex').length);

  let order = num2HexStr(4 + data_hex_str.length / 2) + 'ff03' + data_hex_str;

  return await sendOrder(order);
};

// Switches the port into "flowing mode"
port.on('data', function (answer) {
  let data_hex = answer.toString('hex');
  let re_cmd = data_hex.slice(4, 6);
  let status = data_hex.slice(6, 8);
  let data = data_hex.slice(8, -4);
  console.log("\nre_cmd: ", re_cmd);
  console.log("status: ", status);
  console.log("data: ", data);
  console.log('answer:', answer);

  switch (re_cmd) {
    //get one card
    case '0f':
      operater['0f'](data_hex, status);
      break;
    //read one card
    case '02':
      operater['02'](data_hex, status);
      break;
    //write one card
    case '03':
      operater['03'](data_hex, status);
      break;
    default:
      console.log(`no case found, re_cmd ${re_cmd} is complete, status is ${status}.\n`);
  }
});

let operater = {};

operater['0f'] = async (data_hex, status) => {
  let payload = {};
  if (status === '00' || status === '01') {
    await beep();
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
  if(socket_object.browser) {
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
  if(socket_object.browser) {
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
  if(socket_object.browser) {
    io.sockets.sockets[socket_object.browser.id].emit('rfid_write', payload, (data) => {
      console.log(data);
    });
  }
};
