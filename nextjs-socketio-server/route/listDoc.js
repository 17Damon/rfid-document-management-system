import {useEffect, useContext} from 'react';
import {useRequest} from '@umijs/hooks';
import {Table, Space, PageHeader, Button, Badge} from 'antd';
import {AppContext} from '../pages/index';

const columns = [
  {
    title: '学号',
    dataIndex: 'student_id',
    key: 'student_id',
  },
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    render: text => <a>{text}</a>,
  },
  {
    title: '班级',
    dataIndex: 'class',
    key: 'class',
  },
  {
    title: '出生日期',
    dataIndex: 'birth',
    key: 'birth',
  },
  {
    title: '学院',
    dataIndex: 'department',
    key: 'department',
  },
  {
    title: '出生日期',
    dataIndex: 'birth',
    key: 'birth',
  },
  {
    title: '储位名称',
    dataIndex: 'box_name',
    key: 'box_name',
  },
  {
    title: '档案状态',
    dataIndex: 'doc_status',
    key: 'doc_status',
    render: function (text, record) {
      if (text) return <Badge color="blue" text="在库"/>;
      return <Badge color="yellow" text="借出"/>;
    },
  },
  {
    title: '操作',
    key: 'action',
    render: (text, record) => (
      <Space size="middle">
        <a>删除</a>
      </Space>
    ),
  },
];

const columns1 = [
  {
    title: '编号',
    dataIndex: '_key',
    key: '_key',
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    render: text => <a>{text}</a>,
  },
  {
    title: '控制引脚',
    dataIndex: 'control_pin',
    key: 'control_pin',
  },
  {
    title: '反馈引脚',
    dataIndex: 'feedback_pin',
    key: 'feedback_pin',
  },
  {
    title: '储位状态',
    dataIndex: 'box_status',
    key: 'box_status',
    render: function (text, record) {
      if (text) return <Badge color="yellow" text="占用"/>;
      return <Badge color="blue" text="空置"/>;
    },
  },
  {
    title: '柜门状态',
    dataIndex: 'door_status',
    key: 'door_status',
    render: function (text, record) {
      if (text) return <Badge status="error" text="开启"/>;
      return <Badge status="success" text="关闭"/>;
    },
  },
  {
    title: '网络状态',
    dataIndex: 'status',
    key: 'status',
    render: function (text, record) {
      if (text) return <Badge status="processing" text="在线"/>;
      return <Badge status="error" text="断线"/>;
    },
  },
  {
    title: '操作',
    key: 'action',
    render: (text, record) => (
      <Space size="middle">
        <a>开门</a>
      </Space>
    ),
  },
];

function ListDoc() {

  // const {data, error, loading} = useRequest({
  const req = useRequest({
    url: '/doc/gets',
    method: 'post',
  });

  const req1 = useRequest({
    url: '/box/gets',
    method: 'post',
  });

  const setLoading = useContext(AppContext);

  useEffect(() => {
    document.title = '档案列表';
  }, []);

  useEffect(() => {
    if (req.error || req1.error) {
      if (req.error) console.log('error: ', req.error);
      if (req1.error) console.log('error1: ', req1.error);
    }
    setLoading(req.loading || req1.loading);
  });

  return (
    <div>
      <PageHeader
        className="site-page-header"
        backIcon={false}
        title="档案列表"
      />
      <Table columns={columns} rowKey={record => record._key} dataSource={req.data}/>
      <PageHeader
        className="site-page-header"
        backIcon={false}
        title="储位状态"
      />
      <Table columns={columns1} rowKey={record => record._key} dataSource={req1.data}/>
    </div>
  );
}

export default ListDoc;
