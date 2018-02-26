/*
    react 相关
*/
import React, {Component} from 'react';
import {Link} from 'react-router';

/*
    redux 相关
*/
import { connect } from 'react-redux';
import action from '../action/index';

/*
    公共react组件
*/
import {Header, Footer, Loading} from './common/index';

/*
    相关的模块调用
*/
import Tool from '../lib/Tool/Tool';
import GetNext from '../lib/GetNext/GetNext';
import config from '../config/config';
/*
    组件入口文件
*/
class Index extends Component {
    constructor(props) {
        super(props);
        this.state = this.props.state;
        /*
            初始化
        */
        this.initApp = (props, state) => {
            let {location} = props;
            this.classid = /^\d+$/.test(location.query.classid) ? location.query.classid : config.indexClassId; //如果没有栏目id传过来，默认为0
            location.query.classid = this.classid;
            if (!state.classid[this.classid]) {
                state.classid[this.classid] = Tool.merged(state.def); //没有指定栏目的数据库，将默认的复制过来给指定栏目id
            }
        }

        /*
            DOM更新完成
        */
        this.DOMLoad = (props, state) => {
            let {GET_DATA_START, GET_DATA_SUCCESS, GET_DATA_ERROR} = props;
            let classid = state.classid[this.classid];
            let data = {
                siteid: config.siteid,
                classid: this.classid,
                action: 'new',
                page: classid.page,
                output: 'json'
            };
            window.scrollTo(classid.scrollX, classid.scrollY); //设置滚动条位置
            if (!classid.getNextBtn) return false; //已经全部加载完成分页了，无需重新加载
            this.newGetNext = new GetNext(this.refs.dataload, {
                url: '/article/list.aspx',
                data: data,
                start: (el) => { //开始加载
                    classid.loadState = 0;
                    GET_DATA_START(state);
                },
                load: (data) => { //加载成功
                    classid.page++;
                    if (classid.data && data && classid.data[classid.data.length - 1].id == data[data.length - 1].id || !data) {
                        classid.loadState = 2;
                        classid.loadMsg = '没有了';
                        classid.getNextBtn = false;
                        this.newGetNext.end(); //结束分页插件

                        if (!data) {
                            classid.title = '';
                            classid.loadMsg = '暂无记录';
                        }

                        return GET_DATA_SUCCESS(state);

                    } else if (Tool.isArray(classid.data)) {
                        Array.prototype.push.apply(classid.data, data);
                    } else {
                        classid.data = data;
                    }
                    classid.loadMsg = '上拉加载更多';
                    classid.loadState = 2;
                    if (this.classid === config.indexClassId) {
                        classid.title = config.indexTitle;
                    } else {
                        classid.title = data[0].classname;
                    }

                    GET_DATA_SUCCESS(state);
                },
                error: () => { //加载失败
                    classid.loadState = 1;
                    classid.loadMsg = '加载失败';
                    GET_DATA_ERROR(state);
                }
            });
        }
        /*
            卸载前
        */
        this.unmount = (props, state) => {
            let { SETSCROLL} = props;
            let classid = state.classid[this.classid];
            classid.scrollX = window.scrollX;
            classid.scrollY = window.scrollY;
            SETSCROLL(state); //记录滚动条位置

            if (this.newGetNext) this.newGetNext.end(); //结束分页插件
        }

        this.initApp(this.props, this.state);

    }
    render() {
        let {loadState, title, data, loadMsg} = this.state.classid[this.classid];
        let main = null;
        if (Tool.isArray(data)) {
            main = (<ArticleList list={data} />);
        }
        let index = 0;
        let leftTo = null;
        let leftIcon = null;
        if (this.classid !== config.indexClassId) {
            index = 1;
            leftTo = '/Menu';
            leftIcon = 'fanhui';
        }

        return (
            <div>
                <Header leftTo={leftTo} leftIcon={leftIcon} title={title} />
                {main}
                <div ref="dataload"><Loading loadState={loadState} loadMsg={loadMsg} /></div>
                <Footer index={index}/>
            </div>
        );
    }
    componentDidMount() {
        this.DOMLoad(this.props, this.state);
    }
    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.location.query.classid !== this.classid) {
            this.unmount(this.props, this.state); //卸载前一个栏目相关信息

            this.initApp(nextProps, nextState);
            this.props.CLASSID_UPDATE(this.state);
            this.classidBtn = true;
            return false;
        }

        return true;
    }
    componentDidUpdate() {
        if (this.classidBtn) {
            this.DOMLoad(this.props);
            this.classidBtn = false;
        }
    }
    componentWillUnmount() {
        this.unmount(this.props, this.state);
    }
};

/*
    文章列表
*/
export class ArticleList extends Component {
    render() {
        return (
            <ul className="article-list">
                {
                    this.props.list.map((item, index) => {
                        let {id, book_title, book_content, book_click, classname, book_classid, book_img} = item;
                        book_content = book_content.substring(0, 50) + '...';
                        let images = null;
                        if (/^http/.test(book_img)) {
                            images = (
                                <div className="pictrue"><img src={book_img} /></div>
                            );
                        }

                        return (
                            <li key={index}>
                                <Link to={'/article/' + id}>
                                    {images}
                                    <h3>{book_title}</h3>
                                    <div className="content">{book_content}</div>
                                </Link>
                                <div className="bottom" data-flex="main:justify">
                                    <div className="click">阅读：{book_click}</div>
                                    <div className="to">
                                        <Link to={'/?classid=' + book_classid}>{classname}</Link>
                                    </div>
                                </div>
                            </li>
                        )
                    })
                }
            </ul>
        );
    }
}

export default connect((state) => { return { state: state.classNewList }; }, action('classNewList'))(Index); //连接redux