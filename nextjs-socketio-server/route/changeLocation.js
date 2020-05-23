import {Table, Tag, PageHeader, Space, Modal, Select} from 'antd';
import {useEffect, useState} from 'react';

const { Option } = Select;

const data = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park',
    tags: ['nice', 'developer'],
  },
  {
    key: '2',
    name: 'Jim Green',
    age: 42,
    address: 'London No. 1 Lake Park',
    tags: ['loser'],
  },
  {
    key: '3',
    name: 'Joe Black',
    age: 32,
    address: 'Sidney No. 1 Lake Park',
    tags: ['cool', 'teacher'],
  },
];

function ChangeLocation() {

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: text => <a>{text}</a>,
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Tags',
      key: 'tags',
      dataIndex: 'tags',
      render: tags => (
        <>
          {tags.map(tag => {
            let color = tag.length > 5 ? 'geekblue' : 'green';
            if (tag === 'loser') {
              color = 'volcano';
            }
            return (
              <Tag color={color} key={tag}>
                {tag.toUpperCase()}
              </Tag>
            );
          })}
        </>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (text, record, index) => (
        <Space size="middle">
          <a onClick={
            () => {
              setModalVisible(true);
            }
          }>快速储位调整</a>
        </Space>
      ),
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

  const [ModalText, setModalText] = useState('请选择要调整到的储位:');
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    document.title = '快速储位调整';
  }, []);

  return (
    <div>
      <PageHeader
        className="site-page-header"
        backIcon={false}
        title="快速储位调整"
      />
      <Table columns={columns} dataSource={data}/>
      <Modal
        title="快速储位调整"
        visible={modalVisible}
        onOk={handleOk}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
      >
        <p>{ModalText}</p>
        <Select defaultValue={1} style={{ width: 120 }} >
          <Option value={1}>1号柜</Option>
          <Option value={2}>2号柜</Option>
        </Select>
      </Modal>
    </div>
  );
}

export default ChangeLocation;
