import {Result} from 'antd';
import ListDoc from './listDoc';
import InsertDoc from './insertDoc';
import BorrowDoc from './borrowDoc';
import ReturnDoc from './returnDoc';
import ChangeLocation from './changeLocation';

function Main(props) {
  switch (props.index) {
    case "1":
      return <ListDoc/>;
    case "2":
      return <InsertDoc/>;
    case "3":
      return <BorrowDoc/>;
    case "4":
      return <ReturnDoc/>;
    case "5":
      return <ChangeLocation/>;
    default:
      return (
        <Result
          status="404"
          title="404"
          subTitle="Sorry, the page you visited does not exist."
        />
      );
  }
}

export default Main;
