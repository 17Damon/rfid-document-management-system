/**
 * - 作者
 * - 马文静
 **/

import {Descriptions, PageHeader, Button, Badge, Result} from 'antd';
import {useEffect, useContext, useState} from "react";
import {useRequest} from '@umijs/hooks';
import {AppContext, socket} from '../pages/index';

const docTemp = {
  "name": "",
  "student_id": "",
  "id_card": "",
  "birth": "",
  "class": "",
  "department": "",
  "box_id": "",
  "box_name": "",
  "doc_status": ""
};

const docExample = {
  "name": "马文静",
  "student_id": "20160608756",
  "id_card": "350565199708195689",
  "birth": "1997-08-19",
  "class": "电子1班",
  "department": "先进制造工程学院",
  "box_id": "1",
  "box_name": "1号柜",
  "doc_status": "借出"
};

function ReturnDoc() {
  const [doc, setDoc] = useState(docTemp);
  const [finish, setFinish] = useState(false);
  const [finish_status, setFinishStatus] = useState(false);
  const {setLoading, global_box_status, setSpin_tip} = useContext(AppContext);

  const req = useRequest((box_id) => ({
    url: '/box/open',
    method: 'post',
    data: {
      operate_type: '在库',
      box_id: box_id,
    },
  }), {
    manual: true,
    fetchKey: id => id,
    onSuccess: (result, params) => {
      console.log("open result: ", result);
    }
  });

  useEffect(() => {
    document.title = '档案归还';
  }, []);

  useEffect(() => {
    if (req.error) {
      if (req.error) console.log('error: ', req.error);
    }
  }, [req.loading, req.error]);

  useEffect(() => {
    let cb = async (command, fn) => {
      console.log('receive a event notice_box_door_open: ', command);
      setSpin_tip('柜门已经打开，请放入档案后关闭柜门！');
    };
    let cb1 = async (box_status, fn) => {
      console.log('receive a event notice_box_door_close: ', box_status);
      setLoading(false);
      setFinishStatus(box_status);
      setFinish(true);
    };
    socket.on('notice_box_door_open', cb);
    socket.on('notice_box_door_close', cb1);
    return () => {
      socket.off('notice_box_door_open', cb);
      socket.off('notice_box_door_close', cb1);
    };
  });

  return (
    <div>
      {finish ?
        (<Result
          status={finish_status ? "success" : "warning"}
          title={finish_status ? "柜门已经关闭，档案归还成功！" : "柜门已经关闭，但档案未放入储位中，档案归还未生效！"}
          subTitle="请关闭此页面"
          extra={[
            <Button
              type="primary"
              key="console"
              onClick={() => {
                setFinish(false);
                setDoc(docTemp);
              }}
            >
              关闭
            </Button>,
          ]}
        />)
        :
        (
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
                  if (doc.doc_status === "异常") return <Badge color="red" text="异常"/>;
                  return "";
                })()}
              </Descriptions.Item>
            </Descriptions>
            <br/>
            <Button type="primary"
                    onClick={() => {
                      //todo rfid read && req2.run(record.student_id)
                      setDoc(docExample);
                    }}
            >
              读取RFID标签
            </Button>
            <Button style={{marginLeft: 20}}
                    type="primary"
                    disabled={!(global_box_status && doc.name && (doc.doc_status !== "在库"))}
                    onClick={() => {
                      setSpin_tip('正在打开柜门......');
                      setLoading(true);
                      req.run(doc.box_id);
                    }}
            >
              档案归还
            </Button>
          </div>
        )
      }
    </div>
  );
}

export default ReturnDoc;
