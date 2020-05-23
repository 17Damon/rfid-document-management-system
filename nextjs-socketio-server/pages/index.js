import {Layout, Menu, Spin} from 'antd';
import Main from '../route/main';
import {useState, createContext} from "react";

export const AppContext = createContext();

const {Header, Content, Sider} = Layout;

function App() {
  const [index, setIndex] = useState("1");
  const [loading, setLoading] = useState(false);
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

  return (
    <AppContext.Provider value={setLoading}>
      <Spin spinning={loading}>
        <Layout>
          <Header className="header">
            <div className="logo"/>
            <div>
              <h1 style={{color: 'white'}}>智能档案管理系统</h1>
            </div>
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
