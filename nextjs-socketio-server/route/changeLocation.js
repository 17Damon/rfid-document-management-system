/**
 * - 作者
 * - 马文静
 **/

import {Table, PageHeader, Space, Modal, Select, Badge, Button, message} from 'antd';
import {useRequest} from '@umijs/hooks';
import {useContext, useEffect, useState} from 'react';
import {AppContext, socket} from "../pages";

const {Option} = Select;

function ChangeLocation() {

  const [ModalText, setModalText] = useState('请选择要调整到的储位:');
  const [current, setCurrent] = useState('');
  const [destination, setDestination] = useState('');
  const [operate_type, setOperateType] = useState('储位调整出');
  const [options, setOptions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const {setLoading, global_box_status, setSpin_tip} = useContext(AppContext);


  const req = useRequest({
    url: '/doc/gets',
    method: 'post',
  });

  const req1 = useRequest({
      url: '/box/gets',
      method: 'post',
    },
    {
      onSuccess: (result, params) => {
        if (result.length) setOptions(result);
      }
    });
  const req2 = useRequest((box_id) => ({
    url: '/box/open',
    method: 'post',
    data: {
      operate_type: operate_type,
      box_id: box_id,
      next_box_id:destination
    },
  }), {
    manual: true,
    fetchKey: id => id,
    onSuccess: (result, params) => {
      console.log("open result: ", result);
    }
  });

  useEffect(() => {
    document.title = '快速储位调整';
  }, []);

  useEffect(() => {
    console.log('operate_type: ', operate_type);
  }, [operate_type]);

  useEffect(() => {
    if (req.error || req1.error) {
      if (req.error) console.log('error: ', req.error);
      if (req1.error) console.log('error1: ', req1.error);
    }
    setLoading(req.loading || req1.loading);
  }, [req1.loading, req.loading]);

  useEffect(() => {
    let cb = async (command, fn) => {
      console.log('receive a event notice_box_door_open: ', command);
      if (operate_type === '储位调整出') {
        setSpin_tip('柜门已经打开，请取出档案后关闭柜门！');
      } else if (operate_type === '储位调整进') {
        setSpin_tip('要调整到的储位柜门已经打开，请放入档案后关闭柜门！');
      } else {
        setSpin_tip('operate_type设定错误！');
      }
    };
    let cb1 = async (box_status, fn) => {
      console.log('receive a event notice_box_door_close: ', box_status);
      if (operate_type === '储位调整出') {
        if (box_status) {
          setLoading(false);
          message.warning("柜门已经关闭，但档案未从储位中取出，储位调整未生效！");
        } else {
          setSpin_tip('正在打开要调整到的储位柜门......');
          setOperateType('储位调整进');
          await req2.run(destination);
        }
      } else if (operate_type === '储位调整进') {
        setOperateType('储位调整出');
        setLoading(false);
        if (box_status) {
          message.success("柜门已经关闭，储位调整成功！");
        } else {
          message.warning('柜门已经关闭，但档案未放入要调整到的储位中，储位调整生效，档案状态为异常！');
        }
        req.run();
      } else {
        setSpin_tip('operate_type设定错误！');
      }
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
                      loading={req.fetches[record._key]?.loading}
                      onClick={() => {
                        setModalVisible(true);
                        setCurrent(record.box_id);
                      }}
              >快速储位调整</Button>
            </Space>
          );
        } else {
          return (
            <Space size="middle">
              不可操作
            </Space>
          );
        }
      }
    }
  ];

  let handleOk = () => {
    setModalVisible(false);
    setSpin_tip('正在打开柜门......');
    setOperateType('储位调整出');
    setLoading(true);
    req2.run(current);
  };

  let handleCancel = () => {
    console.log('Clicked cancel button');
    setModalVisible(false);
  };

  let handleChange = (value) => {
    console.log(`selected value: `, value);
    setDestination(value.key);
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
        onCancel={handleCancel}
      >
        <p>{ModalText}</p>
        <Select labelInValue placeholder={"请选择"} style={{width: 120}} onChange={handleChange}>
          {options.map(d => (
            <Option key={d._key} value={d._key}
                    disabled={!(global_box_status && !d.box_status && !d.assign_status)
                    }
            >{d.name}</Option>))}
        </Select>
      </Modal>
    </div>
  );
}

export default ChangeLocation;
