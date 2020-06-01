/**
 * - 作者
 * - 马文静
 **/

import {useState, useEffect, useContext} from "react";
import {useRequest} from '@umijs/hooks';
import {Form, PageHeader, Input, Button, DatePicker, Select, Result, message} from 'antd';
import {AppContext, socket} from '../pages/index';

const {Search} = Input;
const {Option} = Select;

function InsertDoc() {
  const [options, setOptions] = useState([]);
  const [finish, setFinish] = useState(false);
  const [finish_status, setFinishStatus] = useState(false);
  const {setLoading, global_box_status, setSpin_tip} = useContext(AppContext);
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
    socket.on('notice_box_door_open', cb);
    socket.on('notice_box_door_close', cb1);
    return () => {
      socket.off('notice_box_door_open', cb);
      socket.off('notice_box_door_close', cb1);
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
    console.log("result: ", result.length);
    if (result.length > 0) {
      message.error("student_id已经存在于数据库，请更改学号！");
    } else {
      setSpin_tip('正在打开柜门......');
      setLoading(true);
      req1.run(obj);
    }
  };

  function goSpin() {
    console.log("goSpin: ");
    //todo rfid write card
    setLoading(true);
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
            <Button onClick={() => {
              setFinish(false);
              form.resetFields();
            }} type="primary" key="console">
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
              rules={[{required: true, message: '请输入你的 学号!'}]}
            >
              <Search
                enterButton="写入RFID标签"
                // onSearch={value => console.log(value)}
                onSearch={() => goSpin()}
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
