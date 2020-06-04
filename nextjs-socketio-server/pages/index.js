/**
 * - 作者
 * - 马文静
 **/

import {Badge, Layout, Menu, Spin, Row, Col} from 'antd';
import Main from '../route/main';
import {useState, createContext, useEffect} from "react";
import io from 'socket.io-client';

export const socket = io('http://47.98.180.133:10300/', {
  query: {
    type: 'browser',
    token: 'cde'
  }
});

export const rfid_socket = io('http://localhost:13000/', {
  query: {
    type: 'browser',
    token: 'cde'
  }
});

export const AppContext = createContext();

const {Header, Content, Sider} = Layout;

function App() {
  const [index, setIndex] = useState("1");
  const [loading, setLoading] = useState(false);
  const [spin_tip, setSpin_tip] = useState('Loading...');
  const [box_status, setBoxStatus] = useState(false);
  const [server_status, setServerStatus] = useState(false);
  const [rfid_status, setRfidStatus] = useState(false);
  let handleClick = e => {
    switch (e.key) {
      case "1":
        setIndex(e.key);
        break;
      case "2":
        setIndex(e.key);
        break;
      case "3":
        setIndex(e.key);
        break;
      case "4":
        setIndex(e.key);
        break;
      case "5":
        setIndex(e.key);
        break;
      default:
        setIndex(404);
    }
  };

  useEffect(() => {
    // console.log('subscribe event box_status_update.');
    let cb = async (status, fn) => {
      console.log('receive a event box_status_update: ', status);
      setBoxStatus(status);
    };
    let cb1 = () => {
      console.log('socket: ', socket); // true
      console.log('socket.connected: ', socket.connected); // true
      console.log('socket.id: ', socket.id);
      setServerStatus(true);
    };
    let cb2 = () => {
      console.log('user disconnected');
      setServerStatus(false);
      setBoxStatus(false)
    };
    let cb3 = () => {
      console.log('rfid_socket: ', socket); // true
      console.log('rfid_socket.connected: ', socket.connected); // true
      console.log('rfid_socket.id: ', socket.id);
      setRfidStatus(true);
    };
    let cb4 = () => {
      console.log('rfid_socket  disconnected');
      setRfidStatus(false);
    };
    socket.on('box_status_update', cb);
    socket.on('connect', cb1);
    socket.on('disconnect', cb2);
    rfid_socket.on('connect', cb3);
    rfid_socket.on('disconnect', cb4);
    return () => {
      socket.off('box_status_update', cb);
      socket.off('connect', cb1);
      socket.off('disconnect', cb2);
      rfid_socket.off('connect', cb3);
      rfid_socket.off('disconnect', cb4);
    };
  });


  return (
    <AppContext.Provider value={{
      setLoading: setLoading,
      setSpin_tip: setSpin_tip,
      setBoxStatus:setBoxStatus,
      global_box_status: box_status,
      server_status:server_status,
      rfid_status:rfid_status
    }}>
      <Spin spinning={loading} tip={spin_tip}>
        <Layout>
          <Header className="header">
            <div className="logo"/>
            <Row>
              <Col span={3}>
                <h1 style={{color: 'white'}}>智能档案管理系统</h1>
              </Col>
              <Col span={21}>
                {box_status ?
                  <Badge style={{color: 'white'}} color="green" text="档案柜在线"/>
                  :
                  <Badge style={{color: 'white'}} color="red" text="档案柜断开"/>
                }
                &nbsp;&nbsp;&nbsp;
                {server_status ?
                  <Badge style={{color: 'white'}} color="green" text="服务器在线"/>
                  :
                  <Badge style={{color: 'white'}} color="red" text="服务器断开"/>
                }
                &nbsp;&nbsp;&nbsp;
                {rfid_status ?
                  <Badge style={{color: 'white'}} color="green" text="RFID读写器在线"/>
                  :
                  <Badge style={{color: 'white'}} color="red" text="RFID读写器断开"/>
                }
              </Col>
            </Row>
          </Header>
          <Layout>
            <Sider width={200} className="site-layout-background">
              <Menu
                mode="inline"
                onClick={handleClick}
                defaultSelectedKeys={['1']}
                style={{height: '100vh', borderRight: 0}}
              >
                <Menu.Item key="1">首页</Menu.Item>
                <Menu.Item key="2">快速入库</Menu.Item>
                <Menu.Item key="3">档案借出</Menu.Item>
                <Menu.Item key="4">档案归还</Menu.Item>
                <Menu.Item key="5">快速储位调整</Menu.Item>
              </Menu>
            </Sider>
            <Layout style={{padding: '0 24px 24px'}}>
              <Content
                className="site-layout-background"
                style={{
                  padding: 24,
                  margin: 0,
                  minHeight: 280,
                }}
              >
                <Main index={index}/>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </Spin>
    </AppContext.Provider>
  );
}

export default App;
