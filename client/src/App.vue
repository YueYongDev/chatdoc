<script setup>
import {nextTick, onBeforeMount, onMounted, ref, watch} from "vue";
import {fetchDelDoc, fetchDocList, fetchMsg, reportAnswer} from "./api";
import {ElLoading, ElMessage} from "element-plus";
import Upload from "./views/Upload.vue";
import Loading from "@/assets/loading.svg?component";


import {docState, docType, docUrl, formatByteSize, nameWithoutExt, showLastMessage,} from "./utils";
import {DeleteFilled} from "@element-plus/icons-vue";

var docList = ref([]);
var active = ref(null);
watch(active, () => {
  loadMsg();
});

watch(
    () => active?.value?.state,
    (newName, oldName) => {
      console.log(`state changed from ${oldName} to ${newName}`);
    }
);

async function loadDos() {
  let docListFromServer = await fetchDocList();
  if (active.value == null && docListFromServer.data.length >= 0) {
    active.value = docListFromServer.data[0];
    docList.value = docListFromServer.data;
  }
}

// 用于控制轮询的变量
let polling = true;

// 检查所有文档的状态是否都变为2
const allDocsCompleted = () => docList.value.every(doc => doc.state === 2);

// 轮询延迟函数，返回一个 Promise，在指定时间后解决
function delay(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

const loadFileState = async () => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)',
  })
  while (!allDocsCompleted() && polling) {
    try {
      let docListFromServer = await fetchDocList(); // 获取最新的文档列表
      if (docListFromServer.data.length > 0) {
        docList.value = docListFromServer.data;
      }

      // 添加在每次轮询后的动作，如更新active.value
      if (allDocsCompleted()) {
        active.value = docListFromServer.data[0];
        break; // 如果文档都完成了，结束轮询
      }

      // 等待一段时间后继续下一轮轮询
      await delay(4000);

    } catch (error) {
      console.error('Error fetching document list:', error);
      break; // 如果发生错误，结束轮询
    }
  }
  loading.close();
  ElMessage.success('文档解析完毕')
};

var messages = ref([]);
var askErr = ref();


function loadMsg() {
  if (active.value?.doc_id) {
    fetchMsg(active.value?.doc_id).then((res) => {
      if (res.code) {
        askErr.value = res.message;
        ElMessage.error(res.message);
      } else {
        messages.value = res.data || [];
      }
      showLastMessage(1000);
    });
  }
}

onBeforeMount(() => {
  loadDos();
});

const uploadSuccess = async () => {
  await loadDos();
  await loadFileState();
};

const changeDoc = (doc) => {
  active.value = doc;
};

var msgLoading = ref(false);
var input = ref("");


async function query() {
  if (!input.value) {
    return;
  }
  messages.value.push({
    content: input.value,
    role: "user",
  });
  showLastMessage();
  msgLoading.value = true;
  let doc_id = active.value.doc_id;
  let query = input.value;
  let url = "/api/ask/" + doc_id + "?question=" + query;

  const es = new EventSource(url, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
    heartbeatTimeout: 120000, withCredentials: true
  });

  es.onmessage = (e) => {
    if (e.data === "[DONE]") {
      console.log('done')
    }
    const index = messages.value.length - 1;
    if (messages.value[index].role === 'chatdoc') {
      let oldContent = messages.value[index].content
      oldContent += e?.data
      const newValue = {
        content: oldContent,
        role: 'chatdoc'
      };
      messages.value.splice(index, 1, newValue);
    } else {
      messages.value.push({
        content: e?.data || '',
        role: 'chatdoc'
      })
    }
  };

  es.onopen = (e) => {
    console.log('start')
    console.log(e)
  }

  es.onerror = (err) => {
    console.log(err)
    err.target.close()
    msgLoading.value = false;
    input.value = ''
    let answer = messages.value[messages.value.length - 1].content
    reportAnswer(answer, doc_id).then(res => {
      console.log('answer report', res)
    })
  }
}

const refInput = ref(null);
const getFocus = () => {
  nextTick(() => {
    refInput.value.focus();
  });
};
onMounted(() => {
  getFocus();
});

function delDoc(doc_id) {
  if (active.value.doc_id === doc_id) {
    active.value = null;
  }
  if (active.value == null && docList.value.length > 0) {
    active.value = docList.value[0];
  }

  fetchDelDoc(doc_id).then(() => {
    loadDos();
  });
}

const onerror = (e) => {
  console.log(e);
};
</script>

<template>
  <div class="container">
    <div class="sidebar">
      <div style="overflow-y: scroll">
        <div class="add-doc">
          <Upload @upload-success="uploadSuccess"/>
          <!-- <AddLink @upload-success="uploadSuccess"/> -->
        </div>
        <div class="doc-list" v-for="item in docList" :key="item.doc_id">
          <div
              :class="{
              'doc-item': true,
              ellipsis: true,
              'doc-active': item.doc_id === active.doc_id,
            }"
              :title="item.doc_name"
              @click="changeDoc(item)"
          >
            <div class="doc-item-title">
              <span
                  style="
                  display: inline-block;
                  width: 70%;
                  overflow: hidden;
                  text-overflow: ellipsis;
                "
              >{{ nameWithoutExt(item.doc_name) }}</span
              >
              <el-icon @click.stop="delDoc(item.doc_id)" class="remove-icon">
                <DeleteFilled/>
              </el-icon>
            </div>
            <div class="doc-item-info">
              <span class="doc-item-info-cell">type: {{ docType(item) }}</span>
              <span class="doc-item-info-cell"
              >size: {{ formatByteSize(item.size || 0) }}</span
              >
              <span class="doc-item-info-cell">index: {{ docState(item.state) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="user-info">
        <el-avatar
            :size="50"
            src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png"
        />
        <span class="user-name">Anonymous</span>
      </div>
    </div>
    <div class="doc">
      <div v-if="docList.length === 0" class="empty-info">
        <div>当前没有文档, 请先上传</div>
        <div>
          <Upload @upload-success="uploadSuccess"/>
        </div>
      </div>
      <iframe
          v-if="docList.length > 0 && active"
          :src="docUrl(active)"
          style="width: 100%; height: 100%"
          :key="active.doc_id"
          @onerror="onerror"
      ></iframe>
    </div>
    <div class="chat">
      <div id="messages" class="messages">
        <div
            :class="{ 'message-item': true, 'message-user': item.role === 'user' }"
            v-for="(item, index) in messages"
            :key="index"
        >
          {{ item.content }}
        </div>
      </div>
      <div class="loading">
        <el-icon :size="30" v-if="msgLoading">
          <Loading/>
        </el-icon>
      </div>
      <input
          ref="refInput"
          class="input"
          :placeholder="active?.state !== 2 ? '索引构建中...' : '开始与你的文档对话吧'"
          :disabled="active?.state !== 2 || msgLoading"
          v-model="input"
          @keyup.up.enter="query"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ellipsis {
  width: 300px;
  overflow: hidden;
  /*文本不会换行*/
  white-space: nowrap;
  /*当文本溢出包含元素时，以省略号表示超出的文本*/
  text-overflow: ellipsis;
}

.empty-info {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  color: #cdd0d6;
  font-size: 18px;
  align-items: center;
  justify-content: center;
}

.container {
  display: flex;
  width: 100%;
  height: 100vh;

  .sidebar {
    display: flex;
    width: 200px;
    width: 15%;
    flex-direction: column;
    justify-content: space-between;

    .add-doc {
      display: flex;
      padding: 10px;
      align-items: center;
      justify-content: space-between;
    }

    .doc-list {
      display: flex;
      align-items: center;
      justify-content: center;

      &:last-child .doc-item {
        border-bottom: none;
      }

      .doc-item {
        width: 100%;
        padding: 3px 10px;
        display: flex;
        flex-direction: column;
        border-bottom: 1px solid gray;

        .doc-item-title {
          display: flex;
          font-size: 14px;
          height: 28px;
          line-height: 28px;
          justify-content: space-between;

          .remove-icon {
            color: #cdd0d6;
            height: 100%;

            &:hover {
              color: #79bbff;
            }
          }
        }

        .doc-item-info {
          display: flex;
          font-size: 10px;
          color: gray;
          height: 10px;
          line-height: 10px;
          justify-content: space-between;

          .doc-item-info-cell {
            margin: 0 2px;
          }
        }
      }

      .doc-active {
        background-color: #a0cfff;
      }
    }

    .user-info {
      padding: 20px;
      height: 30px;
      display: flex;
      align-items: center;
      border-top: 1px solid #ebedf0;

      .user-name {
        margin: 0 10px;
        color: #cdd0d6;
        font-size: 14px;
      }
    }
  }

  .doc {
    width: 55%;
    display: flex;
    border-right: 1px solid #ebedf0;
    border-left: 1px solid #ebedf0;
  }

  .chat {
    width: 30%;
    flex-direction: column;
    justify-content: space-between;
    display: flex;

    .messages {
      display: flex;
      flex-direction: column;
      padding: 10px;
      overflow-y: scroll;

      .message-item {
        border: 1px solid #cdd0d6;
        padding: 10px;
        margin: 5px 0;
      }

      .message-user {
        background-color: #a0cfff;
      }
    }

    .input {
      margin: 10px;
      padding: 10px;
      height: 30px;
      line-height: 30px;
      border: 1px solid blue;
      background-image: url("assets/send.svg");
      background-repeat: no-repeat;
      background-position: 10px;
      padding-left: 40px;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
