/**
 * - 作者
 * - 马文静
 **/

import {useState, useEffect, useContext} from "react";
import {useRequest} from '@umijs/hooks';
import {Form, PageHeader, Input, Button, DatePicker, Select, Result, message} from 'antd';
import {AppContext, rfid_socket, socket} from '../pages/index';

const {Search} = Input;
const {Option} = Select;

function InsertDoc() {
  const [options, setOptions] = useState([]);
  const [finish, setFinish] = useState(false);
  const [finish_status, setFinishStatus] = useState(false);
  const [rfid_btn_status, setRfidBtnStatus] = useState(true);
  const {setLoading, global_box_status, rfid_status, setSpin_tip} = useContext(AppContext);
  const [form] = Form.useForm();

  useEffect(() => {
    document.title = '快速入库';
  }, []);

  const req = useRequest({
      url: '/box/gets',
      method: 'post',
    },
    {
      onSuccess: (result, params) => {
        if (result.length) setOptions(result);
      }
    });

  const req1 = useRequest((doc) => ({
      url: '/doc/add',
      method: 'post',
      data: doc,
    }),
    {
      manual: true,
      onSuccess: (result, params) => {
      }
    });

  const req2 = useRequest((student_id) => ({
      url: '/doc/getByStudentId',
      method: 'post',
      data: {
        student_id: student_id
      },
    }),
    {
      manual: true,
      onSuccess: (result, params) => {
      }
    });

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
      setSpin_tip('柜门已经打开，请放入档案后关闭柜门！');
    };
    let cb1 = async (box_status, fn) => {
      console.log('receive a event notice_box_door_close: ', box_status);
      setLoading(false);
      setFinishStatus(box_status);
      setFinish(true);
    };
    let cb2 = async (payload, fn) => {
      console.log('receive a event rfid_get: ', payload);
      if (payload.success) {
        message.success(`询查单张电子标签成功，epc_id_hex_str: ${payload.epc_id_hex_str}.`);
      } else {
        message.error(`询查单张电子标签失败，有效范围内没有单张电子标签，或者存在多张电子标签！`);
        setLoading(false);
      }
    };
    let cb3 = async (payload, fn) => {
      console.log('receive a event rfid_write: ', payload);
      if (payload.success) {
        message.success(`写入电子标签成功`);
      } else {
        message.error(`写入电子标签失败`);
      }
      setLoading(false);
    };
    let cb4 = async (payload, fn) => {
      console.log('receive a event no_reader: ', payload);
      message.error(`未找到RFID Reader,请连接设备.`);
      setLoading(false);
    };
    socket.on('notice_box_door_open', cb);
    socket.on('notice_box_door_close', cb1);
    rfid_socket.on('rfid_get', cb2);
    rfid_socket.on('rfid_write', cb3);
    rfid_socket.on('no_reader', cb4);
    return () => {
      socket.off('notice_box_door_open', cb);
      socket.off('notice_box_door_close', cb1);
      rfid_socket.off('rfid_get', cb2);
      rfid_socket.off('rfid_write', cb3);
      rfid_socket.off('no_reader', cb4);
    };
  });

  const layout = {
    labelCol: {span: 8},
    wrapperCol: {span: 8},
  };

  const tailLayout = {
    wrapperCol: {offset: 8, span: 8},
  };

  const onFinish = async (values) => {
    let obj = Object.assign(
      {},
      values,
      {
        birth: values.birth.format("YYYY-MM-DD"),
        box_name: values.box_id.label,
        box_id: values.box_id.value
      }
    );
    let result = await req2.run(obj.student_id);
    if (result.length > 0) {
      message.error("student_id已经存在于数据库，请更改学号！");
    } else {
      setSpin_tip('正在打开柜门......');
      setLoading(true);
      req1.run(obj);
    }
  };

  function onChange(e) {
    const {value} = e.target;
    let valueTemp = value;
    let reg = /^[\d]+$/;
    if (!reg.test(value)) {
      valueTemp = value.slice(0, -1);
    }
    if (value.length === 12) {
      setRfidBtnStatus(false);
    } else {
      setRfidBtnStatus(true);
    }
    form.setFieldsValue({student_id: valueTemp});
  }

  function onPressEnter(e) {
    //ignore Press Enter
  }

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div>
      {finish ?
        (<Result
          status={finish_status ? "success" : "warning"}
          title={finish_status ? "柜门已经关闭，档案入库成功！" : "柜门已经关闭，但档案未放入储位中，档案入库异常！"}
          subTitle="请关闭此页面"
          extra={[
            <Button
              type="primary"
              key="console"
              onClick={() => {
                setFinish(false);
                form.resetFields();
              }}
            >
              关闭
            </Button>,
          ]}
        />)
        :
        (<div>
          <PageHeader
            className="site-page-header"
            backIcon={false}
            title="快速入库"
          />
          <Form
            {...layout}
            form={form}
            name="basic"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
          >
            <Form.Item
              label="姓名"
              name="name"
              rules={[{required: true, message: '请输入你的 姓名!'}]}
            >
              <Input/>
            </Form.Item>

            <Form.Item
              label="学号"
              name="student_id"
              rules={[
                {
                  required: true,
                  message: '请输入你的 学号!'
                },
                ({getFieldValue}) => ({
                  validator(rule, value) {
                    if (!value || value.length === 12) {
                      return Promise.resolve();
                    }
                    return Promise.reject('学号的长度必须等于12!');
                  },
                })
              ]}
            >
              <Search
                enterButton={(
                  <Button
                    type="primary"
                    disabled={!rfid_status || rfid_btn_status}
                  >
                    写入RFID标签
                  </Button>
                )}
                maxLength={12}
                onChange={onChange}
                onPressEnter={onPressEnter}
                onSearch={(value) => {
                  setLoading(true);
                  console.log("写入RFID标签");
                  let payload = {};
                  payload.type = 'getDo';
                  payload.get_do_type = 'write';
                  payload.student_id_str = value;
                  rfid_socket.emit('server_operate', payload, (data) => {
                    console.log(data);
                  });
                }}
              />
            </Form.Item>

            <Form.Item
              label="身份证号"
              name="id_card"
              rules={[{required: true, message: '请输入你的 身份证号!'}]}
            >
              <Input/>
            </Form.Item>

            <Form.Item
              label="出生日期"
              name="birth"
              rules={[{required: true, message: '请输入你的 出生日期!'}]}
            >
              <DatePicker/>
            </Form.Item>

            <Form.Item
              label="班级"
              name="class"
              rules={[{required: true, message: '请输入你的 班级!'}]}
            >
              <Input/>
            </Form.Item>

            <Form.Item
              label="院系"
              name="department"
              rules={[{required: true, message: '请输入你的 院系!'}]}
            >
              <Input/>
            </Form.Item>
            <Form.Item
              label="储位"
              name="box_id"
              rules={[{required: true, message: '请选择你的 储位!'}]}
            >
              <Select labelInValue placeholder={"请选择"} style={{width: 120}}>
                {options.map(d => (
                  <Option key={d._key} value={d._key}
                          disabled={!(global_box_status && !d.box_status && !d.assign_status)
                          }
                  >{d.name}</Option>))}
              </Select>
            </Form.Item>
            <Form.Item {...tailLayout}>
              <Button
                type="primary"
                htmlType="submit"
                disabled={!global_box_status}
              >
                入库
              </Button>
            </Form.Item>
          </Form>
        </div>)}
    </div>
  );
}

export default InsertDoc;
