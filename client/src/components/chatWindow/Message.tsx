import {DollarOutlined, HighlightOutlined} from '@ant-design/icons';
import classNames from 'classnames';
import React, {FC, MouseEvent, PropsWithChildren, ReactNode, useEffect, useState} from 'react';
import {MessageItem} from './constants';
import Loading from './Loading';
import {isEmpty, isString} from 'lodash';
import {Collapse, Space, Tooltip} from 'antd';
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import ReactMarkdown from "react-markdown";

const {Panel} = Collapse;

interface MessageProps extends PropsWithChildren {
    isQuestion?: boolean;
    loading?: boolean;
    text: ReactNode;
    item?: MessageItem;
    chunkIdList?: number[];
    error?: boolean;
    onSourceClick?: (data: any) => void;
}

const Message: FC<MessageProps> = ({
                                       text = '',
                                       isQuestion,
                                       item,
                                       loading,
                                       error,
                                       onSourceClick
                                   }) => {
    const [words, setWords] = useState<string[]>([]);
    const [showSources, setShowSources] = useState<boolean>(false);

    useEffect(() => {
        if (!error && isString(text)) {
            setWords(text.split(' '));
        }
    }, [text]);

    if (loading) {
        return <Loading/>;
    }

    function handleSourceClick(e: MouseEvent, item: any) {
        e.stopPropagation();
        onSourceClick?.(item);
    }

    function toggleShowSource() {
        setShowSources(!showSources);
    }

    return (
        <div
            className={classNames('flex flex-col pt-2 mb-5', {
                ['self-end']: isQuestion,
                ['w-full']: !isQuestion
            })}
        >
            <div
                className={classNames('flex mb-1 justify-between', {
                    ['self-end']: isQuestion
                })}
            >
                <Space className="text-gray-400">
                    <strong className="text-gray-400 pr-2 ">{isQuestion ? 'You' : 'AI'}</strong>

                    {item?.cost && (
                        <Tooltip title={`Estimated cost ${item.cost} tokens`}>
              <span className="cursor-pointer">
                <DollarOutlined/> cost
              </span>
                        </Tooltip>
                    )}
                </Space>

                {!isEmpty(item?.sources) && (
                    <div
                        className="cursor-pointer text-gray-400 text-xs items-center flex"
                        onClick={toggleShowSource}
                    >
                        {showSources ? 'Hide Sources' : 'Show Source'}
                    </div>
                )}
            </div>

            {showSources && (
                <Collapse accordion expandIconPosition="end" size="small" className="mb-3">
                    {item?.sources?.map((item, index) => (
                        <Panel
                            header={`Source ${index + 1}`}
                            key={index + 1}
                            extra={
                                <HighlightOutlined
                                    className="text-gray-400 hover:text-gray-800"
                                    onClick={(e) => handleSourceClick(e, item)}
                                />
                            }
                        >
                            {item.text}
                        </Panel>
                    ))}
                </Collapse>
            )}

            <div
                className={classNames(
                    'flex flex-col pt-2 shadow rounded-lg mb-5 whitespace-pre-wrap',
                    isQuestion ? 'bg-blue-500 self-end text-white' : 'bg-blue-50 w-full'
                )}
            >
                {isQuestion ? (
                    <div className="px-3 pb-2">{text}</div>
                ) : (
                    <div className="px-3 pb-2 text-gray-800 markdown-container">
                        {error ? (
                            text // 当有错误时，显示错误文本
                        ) : (
                            <ReactMarkdown // 无错误时，渲染Markdown文本
                                children={text?.toString()}
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={{
                                    // 自定义段落组件的渲染来去除空行
                                    p: ({node, children}) => {
                                        // 将 children 转换为数组并检查其中的每个元素
                                        const childArray = React.Children.toArray(children);
                                        const isAllEmpty = childArray.every(child => {
                                            // 如果 child 是字符串，检查是否为空或只有空白字符
                                            if (typeof child === 'string') {
                                                return !child.trim();
                                            }
                                            // 如果 child 不是字符串，保留该元素（例如 React 元素）
                                            return false;
                                        });

                                        // 如果所有的 children 都是空字符串，则不渲染该段落
                                        if (isAllEmpty) {
                                            return null;
                                        }
                                        return <span>{children}</span>;
                                    }
                                }}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Message;
