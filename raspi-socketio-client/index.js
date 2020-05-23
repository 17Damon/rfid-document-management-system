const io = require('socket.io-client');

const Gpio = require('onoff').Gpio;
// const locker = new Gpio(18, 'out');
// const gLed = new Gpio(17, 'out');
// const rLed = new Gpio(27, 'out');
// const locker_status = new Gpio(17, 'in', 'both', {debounceTimeout: 10});

var temp_status = 0;
//
// locker_status.watch((err, value) => {
//
//   if (err) {
//     throw err;
//   }
//
//   // console.log("locker_status is changed, the value is: ", value);
//   if (value === 1) {
//     console.log("locker is opened, the value : ", value, locker_status.readSync());
//     temp_status = 1;
//     // rLed.writeSync(1);
//   }
//
//   if (value === 0) {
//     if(temp_status === 1) {
//       console.log("locker is closed, the value : ", value, locker_status.readSync());
//       temp_status = 0;
//     }
//     // rLed.writeSync(0);
//   }
//
// });

const socket = io('http://192.168.5.23:3000/', {
  query: {
    token: 'cde'
  }
});

socket.on('connect', () => {
  console.log('socket.connected: ', socket.connected); // true
  console.log('socket.id: ', socket.id); // true

  // receive client_operate command
  socket.on('client_operate', (command, fn) => {
    console.log('receive a event client_operate: ', command);
    let result = false;
    switch (command) {
      case 'test':
        result = test();
        break;
      case 'ledOn':
        result = ledOn();
        break;
      case 'ledOff':
        result = ledOff();
        break;
      case 'lockerOpen':
        result = lockerOpen();
        break;
      case 'sendToServer':
        result = sendMessage();
        break;
      default:
        console.log('Sorry, can\'t find command ' + command + '.');

    }
    if (result) {
      fn('zbg_client_completed');
    } else {
      fn('client_failed');
    }
  });

});

// helper tools

function test() {
  return true;
}

function ledOn() {
  gLed.writeSync(1);
  return true;
}

function ledOff() {
  gLed.writeSync(0);
  return false;
}

async function lockerOpen() {
  locker.writeSync(1);
  await timeout(10);
  locker.writeSync(0);
  return false;
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
