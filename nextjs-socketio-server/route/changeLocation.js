import {Table, Tag, PageHeader, Space, Modal, Select, Badge} from 'antd';
import {useRequest} from '@umijs/hooks';
import {useContext, useEffect, useState} from 'react';
import {AppContext} from "../pages";

const {Option} = Select;

function ChangeLocation() {

  const [ModalText, setModalText] = useState('请选择要调整到的储位:');
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const setLoading = useContext(AppContext);

  const req = useRequest({
    url: '/doc/gets',
    method: 'post',
  });

  const req1 = {};

  useEffect(() => {
    document.title = '快速储位调整';
  }, []);

  useEffect(() => {
    if (req.error || req1.error) {
      if (req.error) console.log('error: ', req.error);
      if (req1.error) console.log('error1: ', req1.error);
    }
    setLoading(req.loading);
  });

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: text => <a>{text}</a>,
    },
    {
      title: '学号',
      dataIndex: 'student_id',
      key: 'student_id',
    },
    {
      title: '身份证号',
      dataIndex: 'id_card',
      key: 'id_card',
    },
    {
      title: '出生日期',
      dataIndex: 'birth',
      key: 'birth',
    },
    {
      title: '班级',
      dataIndex: 'class',
      key: 'class',
    },
    {
      title: '院系',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: '储位',
      dataIndex: 'box_name',
      key: 'box_name',
    },
    {
      title: '档案状态',
      dataIndex: 'doc_status',
      key: 'doc_status',
      render: function (text, record) {
        if (text === "在库") return <Badge color="blue" text="在库"/>;
        if (text === "借出") return <Badge color="yellow" text="借出"/>;
        return <Badge color="red" text="异常"/>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (text, record, index) => (
        <Space size="middle">
          <a onClick={
            () => {
              setModalVisible(true);
            }
          }>快速储位调整</a>
        </Space>
      )
    },
  ];

  let handleOk = () => {
    setConfirmLoading(true);
    setModalText('The modal will be closed after two seconds');
    setTimeout(() => {
      setConfirmLoading(false);
      setModalVisible(false);
    }, 3000);
  };

  let handleCancel = () => {
    console.log('Clicked cancel button');
    setModalVisible(false);
  };

  return (
    <div>
      <PageHeader
        className="site-page-header"
        backIcon={false}
        title="快速储位调整"
      />
      <Table columns={columns} rowKey={record => record._key} dataSource={req.data}/>
      <Modal
        title="快速储位调整"
        visible={modalVisible}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
      >
        <p>{ModalText}</p>
        <Select defaultValue={1} style={{width: 120}}>
          <Option value={1}>1号柜</Option>
          <Option value={2}>2号柜</Option>
        </Select>
      </Modal>
    </div>
  );
}

export default ChangeLocation;
