/**
 * - 作者
 * - 马文静
 **/

import {Badge, Layout, Menu, Spin, Row, Col} from 'antd';
import Main from '../route/main';
import {useState, createContext, useEffect} from "react";
import io from 'socket.io-client';

export const socket = io('http://192.168.0.104:3000/', {
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
    socket.on('box_status_update', cb);
    socket.on('connect', cb1);
    socket.on('disconnect', cb2);
    return () => {
      socket.off('box_status_update', cb);
      socket.off('connect', cb1);
      socket.off('disconnect', cb2);
    };
  });


  return (
    <AppContext.Provider value={{
      setLoading: setLoading,
      setSpin_tip: setSpin_tip,
      setBoxStatus:setBoxStatus,
      global_box_status: box_status,
      server_status:server_status
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
