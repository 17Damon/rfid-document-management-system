import {Table, Tag, PageHeader, Space, Badge, Button} from 'antd';
import {useRequest} from '@umijs/hooks';
import {useContext, useEffect} from 'react';
import {AppContext} from '../pages/index';

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
    render: function (text, record, index) {
      if (record.doc_status && record.doc_status === "在库") {
        return (
          <Space size="middle">
            <Button type="primary"
            //         loading={req2.fetches[record._key]?.loading} onClick={() => {
            //   req2.run(record._key)
            // }}
            >借出</Button>
          </Space>
        );
      } else {
        return (
          <Space size="middle">
            不可借出
          </Space>
        );
      }
    }
  },
];

function BorrowDoc() {

  const setLoading = useContext(AppContext);

  const req = useRequest({
    url: '/doc/gets',
    method: 'post',
  });

  useEffect(() => {
    document.title = '档案借出';
  }, []);

  const req1 = {};

  useEffect(() => {
    if (req.error || req1.error) {
      if (req.error) console.log('error: ', req.error);
      if (req1.error) console.log('error1: ', req1.error);
    }
    setLoading(req.loading);
  });

  return (
    <div>
      <PageHeader
        className="site-page-header"
        backIcon={false}
        title="档案借出"
      />
      <Table columns={columns} rowKey={record => record._key} dataSource={req.data}/>
    </div>
  );
}

export default BorrowDoc;
