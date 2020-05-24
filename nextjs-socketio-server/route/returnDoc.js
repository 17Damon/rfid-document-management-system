import {Descriptions, PageHeader, Button, Badge} from 'antd';
import {useEffect, useContext, useState} from "react";
import {AppContext} from '../pages/index';

const docExample = {
  "name": "马文静",
  "student_id": "20160608756",
  "id_card": "350565199708195689",
  "birth": "1997-08-19",
  "class": "电子1班",
  "department": "先进制造工程学院",
  "box_id": "1",
  "box_name": "1号柜",
  "doc_status": "异常"
};

function ReturnDoc() {
  const [doc, setDoc] = useState(docExample);

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
      <Descriptions style={{backgroundColor: 'white'}} bordered>
        <Descriptions.Item label="姓名"><a>{doc.name}</a></Descriptions.Item>
        <Descriptions.Item label="学号">{doc.student_id}</Descriptions.Item>
        <Descriptions.Item label="身份证号">{doc.id_card}</Descriptions.Item>
        <Descriptions.Item label="出生日期">{doc.birth}</Descriptions.Item>
        <Descriptions.Item label="班级">{doc.class}</Descriptions.Item>
        <Descriptions.Item label="院系">{doc.department}</Descriptions.Item>
        <Descriptions.Item label="储位">{doc.box_name}</Descriptions.Item>
        <Descriptions.Item label="档案状态">
          {(function () {
            if (doc.doc_status === "在库") return <Badge color="blue" text="在库"/>;
            if (doc.doc_status === "借出") return <Badge color="yellow" text="借出"/>;
            return <Badge color="red" text="异常"/>;
          })()}
        </Descriptions.Item>
      </Descriptions>
      <br/>
      <Button type="primary" >
        读取RFID标签
      </Button>
      <Button style={{marginLeft: 20}} type="primary" disabled = {!doc.name || (doc.doc_status === "在库")}>
        档案归还
      </Button>
    </div>
  );
}

export default ReturnDoc;
