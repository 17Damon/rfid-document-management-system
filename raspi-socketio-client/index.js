/**
 * - 作者
 * - 马文静
 **/

const Gpio = require('onoff').Gpio;
const locker1 = new Gpio(18, 'out');
const locker_status1 = new Gpio(17, 'in', 'both', {debounceTimeout: 10});
const sensor_status1 = new Gpio(27, 'in', 'both', {debounceTimeout: 10});
const locker2 = new Gpio(25, 'out');
const locker_status2 = new Gpio(9, 'in', 'both', {debounceTimeout: 10});
const sensor_status2 = new Gpio(11, 'in', 'both', {debounceTimeout: 10});

//电控锁状态
var locker_temp_status1 = 0;
var locker_temp_status2 = 0;

//光电传感器状态
var sensor_temp_status1 = 0;
var sensor_temp_status2 = 0;
var box_object = {};

//网络通信模块
const io = require('socket.io-client');
const socket = io('http://192.168.0.104:3000/', {
  query: {
    type: 'box',
    token: 'cde'
  }
});

var cb = async (payload, fn) => {
  console.log('receive a event client_operate payload: ', payload);
  box_object[payload.box_id] = payload;
  let result = false;
  switch (payload.type) {
    case 'box_open':
      result = await box_open(payload.box_id);
      break;
    case 'sendToServer':
      result = await sendMessage();
      break;
    default:
      console.log('Sorry, can\'t find command ' + payload.type + '.');
  }
  if (result) {
    fn('client_completed');
  } else {
    fn('client_failed');
  }
};

socket.on('connect', () => {
  console.log('socket.connected: ', socket.connected); // true
  console.log('socket.id: ', socket.id);

  socket.on('disconnect', function () {
    console.log('user disconnected');
    socket.off('client_operate', cb);
    socket.off('disconnect');
  });

  // receive client_operate command
  socket.on('client_operate', cb);

});

// 电控锁状态反馈
locker_status1.watch((err, value) => {

  if (err) {
    throw err;
  }

  if (value === 1) {
    console.log("locker1 is opened, the value : ", value, locker_status1.readSync());
    locker_temp_status1 = 1;
  }

  if (value === 0) {
    if (locker_temp_status1 === 1) {
      console.log("locker1 is closed, the value : ", value, locker_status1.readSync());
      locker_temp_status1 = 0;
      let payload = box_object['1'];
      payload.type = 'closeDoor';
      payload.box_id = '1';
      payload.box_status = !!sensor_temp_status1;
      socket.emit('server_operate', payload, (data) => {
        console.log(data);
      });
    }
  }

});

locker_status2.watch((err, value) => {

  if (err) {
    throw err;
  }

  if (value === 1) {
    console.log("locker2 is opened, the value : ", value, locker_status2.readSync());
    locker_temp_status2 = 1;
  }

  if (value === 0) {
    if (locker_temp_status2 === 1) {
      console.log("locker2 is closed, the value : ", value, locker_status2.readSync());
      locker_temp_status2 = 0;
      let payload = box_object['2'];
      payload.type = 'closeDoor';
      payload.box_id = '2';
      payload.box_status = !!sensor_temp_status2;
      socket.emit('server_operate', payload, (data) => {
        console.log(data);
      });
    }
  }

});

//光电传感器状态反馈
sensor_status1.watch((err, value) => {

  if (err) {
    throw err;
  }

  if (value === 1) {
    console.log("sensor1 is opened, the value : ", value, sensor_status1.readSync());
    sensor_temp_status1 = 1;
  }

  if (value === 0) {
    if (sensor_temp_status1 === 1) {
      console.log("sensor1 is closed, the value : ", value, sensor_status1.readSync());
      sensor_temp_status1 = 0;
    }
  }

});

sensor_status2.watch((err, value) => {

  if (err) {
    throw err;
  }

  if (value === 1) {
    console.log("sensor2 is opened, the value : ", value, sensor_status2.readSync());
    sensor_temp_status2 = 1;
  }

  if (value === 0) {
    if (sensor_temp_status2 === 1) {
      console.log("sensor2 is closed, the value : ", value, sensor_status2.readSync());
      sensor_temp_status2 = 0;
    }
  }

});

async function box_open(box_id) {
  if (box_id === '1') {
    locker1.writeSync(1);
    await timeout(10);
    locker1.writeSync(0);
  } else if (box_id === '2') {
    locker2.writeSync(1);
    await timeout(10);
    locker2.writeSync(0);
  } else {
    return false;
  }
  return true;
}

function sendMessage() {
  socket.emit('server_operate', 'start', (data) => {
    console.log(data);
  });
  return true;
}

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
