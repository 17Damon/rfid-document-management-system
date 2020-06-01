/**
 * - 作者
 * - 马文静
 **/

import {Table, PageHeader, Space, Badge, Button, message} from 'antd';
import {useRequest} from '@umijs/hooks';
import {useContext, useEffect} from 'react';
import {AppContext, socket} from '../pages/index';

function BorrowDoc() {

  const {setLoading, global_box_status, setSpin_tip} = useContext(AppContext);

  const req1 = useRequest((box_id) => ({
    url: '/box/open',
    method: 'post',
    data: {
      operate_type: '借出',
      box_id: box_id,
    },
  }), {
    manual: true,
    fetchKey: id => id,
    onSuccess: (result, params) => {
      console.log("open result: ", result);
    }
  });

  const req = useRequest({
      url: '/doc/gets',
      method: 'post',
    },
    {
      onSuccess: (result, params) => {
        setLoading(false);
      }
    });

  useEffect(() => {
    document.title = '档案借出';
  }, []);

  useEffect(() => {
    if (req.error || req1.error) {
      if (req.error) console.log('error: ', req.error);
      if (req1.error) console.log('error1: ', req1.error);
    }
    setLoading(req.loading);
  }, [req.loading]);

  useEffect(() => {
    let cb = async (command, fn) => {
      console.log('receive a event notice_box_door_open: ', command);
      setSpin_tip('柜门已经打开，请取出档案后关闭柜门！');
    };
    let cb1 = async (box_status, fn) => {
      console.log('receive a event notice_box_door_close: ', box_status);
      setLoading(false);
      if (box_status) {
        message.warning("柜门已经关闭，但档案未从储位中取出，档案借出未生效！");
      } else {
        message.success("柜门已经关闭，档案借出成功！");
      }
      req.run();
    };
    socket.on('notice_box_door_open', cb);
    socket.on('notice_box_door_close', cb1);
    return () => {
      socket.off('notice_box_door_open', cb);
      socket.off('notice_box_door_close', cb1);
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
        if (global_box_status && record.doc_status && record.doc_status === "在库") {
          return (
            <Space size="middle">
              <Button type="primary"
                      loading={req1.fetches[record._key]?.loading}
                      onClick={() => {
                        setSpin_tip('正在打开柜门......');
                        setLoading(true);
                        req1.run(record.box_id);
                      }}
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
