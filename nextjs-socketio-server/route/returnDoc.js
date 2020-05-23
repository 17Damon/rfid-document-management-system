import {Descriptions, PageHeader, Button} from 'antd';
import {useEffect, useContext} from "react";
import {AppContext} from '../pages/index';

function ReturnDoc() {

  const setLoading = useContext(AppContext);

  useEffect(() => {
    document.title = '档案归还';
  }, []);

  return (
    <div>
      <PageHeader
        className="site-page-header"
        backIcon={false}
        title="档案归还"
      />
      <Descriptions style={{backgroundColor:'white'}} bordered >
        <Descriptions.Item label="UserName">Zhou Maomao</Descriptions.Item>
        <Descriptions.Item label="Telephone">1810000000</Descriptions.Item>
        <Descriptions.Item label="Live">Hangzhou, Zhejiang</Descriptions.Item>
        <Descriptions.Item label="Remark">empty</Descriptions.Item>
        <Descriptions.Item label="Address">
          No. 18, Wantang Road, Xihu District, Hangzhou, Zhejiang, China
        </Descriptions.Item>
      </Descriptions>
      <br/>
      <Button type="primary" >
        读取RFID标签
      </Button>
      <Button style={{ marginLeft:20 }} type="primary" >
        档案归还
      </Button>
    </div>
  );
}

export default ReturnDoc;
