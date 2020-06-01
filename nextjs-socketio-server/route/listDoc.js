/**
 * - 作者
 * - 马文静
 **/

import {useEffect, useContext} from 'react';
import {useRequest} from '@umijs/hooks';
import {Table, Space, PageHeader, Button, Badge, message} from 'antd';
import {AppContext} from '../pages/index';
import {socket} from '../pages/index';

function ListDoc() {
  const {setLoading, setBoxStatus, server_status} = useContext(AppContext);

  const req3 = useRequest((key) => ({
    url: '/box/open',
    method: 'post',
    data: {
      operate_type: '异常',
      box_id: key,
    },
  }), {
    manual: true,
    fetchKey: id => id,
    onSuccess: (result, params) => {
      console.log("open result: ", result);
      if (result.success) {
        message.success(`打开成功.`);
        req1.run();
      } else {
        message.error(`打开失败.`);
      }
    }
  });

  const req2 = useRequest((doc) => ({
    url: '/doc/delete',
    method: 'post',
    data: {
      box_id: doc.box_id,
      key: doc._key
    },
  }), {
    manual: true,
    fetchKey: id => id,
    onSuccess: (result, params) => {
      console.log("delete result: ", result);
      if (result.success) {
        message.success(`删除成功.`);
        req.run();
        req1.run();
      } else {
        message.error(`删除失败.`);
      }
    }
  });

  const req = useRequest({
    url: '/doc/gets',
    method: 'post',
  });

  const req1 = useRequest({
    url: '/box/gets',
    method: 'post',
  },{
    onSuccess: (result, params) => {
      setBoxStatus(result[0].status);
    }
  });

  useEffect(() => {
    document.title = '档案列表';
  }, []);

  useEffect(() => {
    if (req.error || req1.error) {
      if (req.error) console.log('error: ', req.error);
      if (req1.error) console.log('error1: ', req1.error);
    }
    setLoading(req.loading || req1.loading);
  },[req.loading,req1.loading]);

  useEffect(() => {
    let cb = async (command, fn) => {
      console.log('receive a event box_status_update: ', command);
      // req.run();
      req1.run();
    };
    let cb1 = async (command, fn) => {
      console.log('receive a event notice_box_door_close: ', command);
      req.run();
      req1.run();
    };
    socket.on('notice_box_door_close', cb1);
    socket.on('box_status_update', cb);
    return () => {
      socket.off('notice_box_door_close', cb1);
      socket.off('box_status_update', cb);
    };
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
      render: function (text, record, index) {
        if (record.doc_status && record.doc_status === "异常") {
          return (
            <Space size="middle">
              <Button type="primary" loading={req2.fetches[record._key]?.loading} onClick={() => {
                req2.run(record)
              }}>删除</Button>
            </Space>
          );
        } else {
          return (
            <Space size="middle">
              不能删除
            </Space>
          );
        }
      }
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
      title: '分配状态',
      dataIndex: 'assign_status',
      key: 'assign_status',
      render: function (text, record) {
        if (text) return <Badge color="yellow" text="已分配"/>;
        return <Badge color="blue" text="未分配"/>;
      },
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
        if (server_status && text) return <Badge status="processing" text="在线"/>;
        return <Badge status="error" text="断线"/>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: function (text, record, index) {
        if (record.status && !record.door_status && record.box_status) {
          return (
            <Space size="middle">
              <Button type="primary" loading={req3.fetches[record._key]?.loading} onClick={() => {
                req3.run(record._key)
              }}>开门</Button>
            </Space>
          );
        } else {
          return (
            <Space size="middle">
              不能操作
            </Space>
          );
        }
      }
    },
  ];

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
        title="储位列表"
      />
      <Table columns={columns1} rowKey={record => record._key} dataSource={req1.data}/>
    </div>
  );

}

export default ListDoc;
