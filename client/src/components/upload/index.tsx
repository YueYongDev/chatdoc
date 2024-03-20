import { InboxOutlined } from '@ant-design/icons';
import { message, Spin, Upload } from 'antd';
import { useState } from 'react';
import confetti from 'canvas-confetti';
import { baseURL } from '../../utils/request';
import userIdKey from '../../utils/userIdKey';
import eventEmitter from '../../utils/eventEmitter';

const { Dragger } = Upload;

function generateConfetti() {
  confetti({
    spread: 90,
    particleCount: 80,
    origin: { y: 0.5 },
    ticks: 300
  });
}

export default function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const userId = userIdKey();

  const onUploadChange = (info: any) => {
    setUploading(true);
    const { status } = info.file;
    if (status === 'done' || status === 'success') {
      generateConfetti();
      void message.success({
        content: `${info.file.name} file uploaded successfully. token usage: 💰 ${info.file.response}`,
        duration: 8
      });
      eventEmitter.emit('refreshFileList');
      setUploading(false);
    } else if (status === 'error') {
      void message.error(
        `${info.file.name} file upload failed. ${JSON.stringify(info.file.response)}`
      );
      setUploading(false);
    }
  };

  const checkFileSize = (file: any) => {
    const isOverSize = file.size / 1024 / 1024 > 5;
    if (isOverSize) {
      // setUploading(false);
      void message.error(`${file.name} is too large`);
      setUploading(false);
      // return true;
    }
    return !isOverSize || Upload.LIST_IGNORE;
  };


  return (
    <div className="w-full">
      <Spin spinning={uploading}>
        <Dragger
            action={`${baseURL}/api/upload`}
            data={{userId}}
            multiple={false}
            showUploadList={false}
            name="file"
            accept=".md,.pdf"
            onChange={onUploadChange}
            beforeUpload={checkFileSize}
            disabled={!userId}
        >
          <p className="text-blue-500">
            <InboxOutlined style={{fontSize: 32}}/>
          </p>
          <p className="text-sm">点击或者拖拽来提交文件</p>
          <p className="text-xs text-gray-800">附件大小不超过5M</p>
          <p className="text-xs text-gray-400">支持 .md,.pdf文件</p>
        </Dragger>
      </Spin>
    </div>
  );
}
