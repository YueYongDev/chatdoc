import {Empty} from 'antd';
import {useContext, useEffect, useState} from 'react';
import ChatWindow from '../components/chatWindow';
import request from '../utils/request';
import eventEmitter from '../utils/eventEmitter';
import PdfViewer from '../components/pdfViewer';
import {isEmpty, has} from 'lodash';
import FileItem from '../constants/fileItem';
import {CurrentFileContext} from '../context/currentFile';
import isPdf from '../utils/isPdf';
import HtmlViewer from '../components/htmlViewer';
import MarkdownViewer from "../components/markdownViewer";
import isMarkdown from "../utils/isMarkdown";
import isBlob from "../utils/isBlob";

function removeHighLight() {
    const highLightElements = document.querySelectorAll('.hl-source');
    highLightElements?.forEach((element) => {
        element.classList.remove('hl-source');
    });
}

function addHighLight(chunkId: string, time = 400) {
    removeHighLight();
    const firstElement = document.querySelector(`[data-chunk_id=${chunkId}]`);
    setTimeout(() => {
        firstElement?.scrollIntoView({behavior: 'smooth'});
    }, time);

    const highLightElements = document.querySelectorAll(`[data-chunk_id=${chunkId}]`);

    highLightElements?.forEach((element) => {
        element.classList.add('hl-source');
    });
}

async function downloadFile(fileItem: FileItem) {
    let res;
    if (isPdf(fileItem.ext)) {
        res = await request(fileItem.path, {
            responseType: 'blob'
        });
    } else if (isMarkdown(fileItem.ext)) {
        res = await request(fileItem.path);
    } else {
        res = await request(fileItem.path);
    }

    return res.data;
}

const Home = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const currentFile = useContext(CurrentFileContext);

    useEffect(() => {
        getFile()
        eventEmitter.emit('cleanChat');
    }, [currentFile]);

    async function getFile() {
        console.log("获取一次文件", currentFile)
        if (currentFile) {
            setLoading(true);
            const file = await downloadFile(currentFile);
            setFile(file);
            setLoading(false);
            console.log("文件加载成功", file)
        }
    }

    function handleHighLight(item: any, time = 400) {
        if (isEmpty(item)) {
            return;
        }
        // PDF
        if (has(item.extraInfo, 'page_no')) {
            eventEmitter.emit('scrollToPage', {pageNo: item.extraInfo.page_no, time});
        } else {
            addHighLight(item.extraInfo.chunk_id, time);
        }
    }

    return (
        <div className="w-full flex">
            <div className="flex h-full overflow-auto flex-1 justify-center py-3">
                {file ? (
                    <>
                        {isBlob(file)
                            ? (<PdfViewer file={file}/>)
                            : (<MarkdownViewer markdown={file} loading={loading}/>)
                        }
                    </>
                ) : (
                    <Empty
                        className="mt-24"
                        image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
                        imageStyle={{height: 60}}
                        description={<span>No uploaded file.</span>}
                    />
                )}
            </div>

            <ChatWindow
                fullFileName={currentFile?.fullName || ''}
                fileName={currentFile?.name.split(currentFile.ext)[0] || ''}
                className="flex flex-col"
                onReplyComplete={handleHighLight}
                onSourceClick={(item) => handleHighLight(item, 0)}
            />
        </div>
    );
};

export default Home;
